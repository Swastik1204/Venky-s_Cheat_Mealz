/* eslint-env node */
// Vercel Serverless Function: Create Razorpay Order
// Endpoint: /api/create-order
// Method: POST
// Body: { amount: number, items?: [...], cartChecksum?: string }
// Returns: { orderId, amount, currency }
// Server verifies amount against menu prices when items are provided.

import Razorpay from 'razorpay'
import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyAuth } from './_lib/verifyAuth.js'
import { handleCors } from './_lib/cors.js'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// NOTE: Staff new-order pushes moved to /api/notify-order, which fires after
// the order document is persisted (covers COD orders and uses real order data
// instead of the pre-payment request body).

const rateLimiter = createRateLimiter({ routeName: 'create-order' })

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

// Initialize Firebase Admin (singleton)
if (!getApps().length) {
  const sa = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim()
  if (sa) {
    try { initializeApp({ credential: cert(JSON.parse(sa)) }) } catch { initializeApp() }
  } else {
    initializeApp()
  }
}

// Max allowed difference between client amount and server-computed total (₹)
const PRICE_TOLERANCE = 1

/**
 * Verify client-sent cart total against Firestore menu prices.
 * Returns { valid, serverTotal, message? }
 */
async function verifyCartAmount(items, clientAmount) {
  if (!Array.isArray(items) || !items.length) {
    // No items sent — skip verification (backward compat)
    return { valid: true, serverTotal: clientAmount }
  }
  try {
    const db = getFirestore()
    const menuSnap = await db.collection('menu').get()
    // Build price lookup: lowercase item name → rate
    const priceLookup = new Map()
    menuSnap.docs.forEach(catDoc => {
      const data = catDoc.data()
      const catItems = Array.isArray(data.items) ? data.items : []
      catItems.forEach(item => {
        const name = String(item.name || '').trim().toLowerCase()
        if (!name) return
        // Store base rate
        const rate = Number(item.rate ?? item.price ?? 0)
        priceLookup.set(name, rate)
        // Also index variants
        if (Array.isArray(item.variants)) {
          item.variants.forEach(v => {
            const vLabel = String(v.label || v.name || '').trim().toLowerCase()
            if (vLabel) {
              priceLookup.set(`${name}::${vLabel}`, Number(v.rate ?? v.price ?? rate))
            }
          })
        }
      })
    })

    let serverTotal = 0
    for (const item of items) {
      const name = String(item.name || '').trim().toLowerCase()
      const qty = Number(item.qty || 1)
      const variantLabel = String(item.variantLabel || '').trim().toLowerCase()
      // Look up price: try variant-specific first, then base item
      let serverRate = variantLabel ? priceLookup.get(`${name}::${variantLabel}`) : undefined
      if (serverRate === undefined) serverRate = priceLookup.get(name)
      if (serverRate === undefined) {
        // Item not found in menu — allow the client rate (could be add-on or custom)
        serverRate = Number(item.rate || 0)
      }
      serverTotal += serverRate * qty
    }
    serverTotal = Math.round(serverTotal * 100) / 100

    const diff = Math.abs(clientAmount - serverTotal)
    if (diff > PRICE_TOLERANCE) {
      return {
        valid: false,
        serverTotal,
        message: `Price mismatch: client sent ₹${clientAmount}, server computed ₹${serverTotal}`
      }
    }
    return { valid: true, serverTotal }
  } catch (err) {
    // If menu lookup fails, don't block the order — log and allow
    console.warn('[create-order] Price verification failed, allowing order:', err.message)
    return { valid: true, serverTotal: clientAmount }
  }
}

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded
  if (!(process.env.RAZORPAY_KEY_SECRET || '').trim()) {
    return res.status(500).json({ error: 'Server misconfigured: RAZORPAY_KEY_SECRET not set' })
  }
  // CORS with 24-hour preflight caching
  if (handleCors(req, res, 'POST, OPTIONS')) return
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  // Verify Firebase Auth token
  const auth = await verifyAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  try {
    const { amount, items, cartChecksum } = req.body || {}
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    // Server-side amount ceiling to prevent abuse (max ₹50,000 per order)
    const MAX_ORDER_AMOUNT = 50000
    if (Number(amount) > MAX_ORDER_AMOUNT) {
      return res.status(400).json({ error: 'Amount exceeds maximum order limit', maxAmount: MAX_ORDER_AMOUNT })
    }

    // Verify cart total against menu prices
    const verification = await verifyCartAmount(items, Number(amount))
    if (!verification.valid) {
      return res.status(400).json({ error: verification.message })
    }
    // Use server-verified amount when items were provided
    const finalAmount = verification.serverTotal

    const options = {
      amount: Math.round(finalAmount * 100), // in paise
      currency: 'INR',
      receipt: 'rcpt_' + Date.now(),
      notes: { checksum: cartChecksum || 'na' }
    }

    const order = await razorpay.orders.create(options)

    return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency })
  } catch (e) {
    console.error('create-order error', e)
    return res.status(500).json({ error: 'Failed to create order' })
  }
}
