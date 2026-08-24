/* eslint-env node */
// Vercel Serverless Function: Verify Razorpay Payment Signature
// Endpoint: /api/verify-payment
// Method: POST
// Body: { orderId: string, paymentId: string, signature: string, orderNo?: string }
// Returns: { valid: boolean, recorded?: boolean }
//
// When orderNo is provided, a valid signature also writes payment.status='paid'
// onto the Firestore order document (belt-and-suspenders with the Razorpay
// webhook, which remains the authoritative reconciler). Customers cannot write
// this themselves — Firestore rules block customer updates on orders.

import crypto from 'crypto'
import Razorpay from 'razorpay'
import { createRateLimiter } from './lib/rateLimiter.js'
import { verifyAuth } from './lib/verifyAuth.js'
import { handleCors } from './lib/cors.js'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const rateLimiter = createRateLimiter({ routeName: 'verify-payment' })

// Initialize Firebase Admin (singleton)
if (!getApps().length) {
  const sa = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim()
  if (sa) {
    try { initializeApp({ credential: cert(JSON.parse(sa)) }) } catch { initializeApp() }
  } else {
    initializeApp()
  }
}

/**
 * Record a verified payment on the order document.
 * Guards: order must exist, belong to the authenticated user, not be COD,
 * not already be paid, and the Razorpay order amount must match the order total.
 * Returns { recorded: boolean, reason?: string } — never throws.
 */
async function recordPaidStatus({ orderNo, razorpayOrderId, paymentId, uid }) {
  try {
    const db = getFirestore()
    const ref = db.collection('orders').doc(String(orderNo))
    const snap = await ref.get()
    if (!snap.exists) return { recorded: false, reason: 'order_not_found' }
    const order = snap.data() || {}

    if (!uid || order.userId !== uid) return { recorded: false, reason: 'not_order_owner' }
    if (String(order.payment?.method || '').toLowerCase() === 'cod') return { recorded: false, reason: 'cod_order' }
    if (String(order.payment?.status || '').toLowerCase() === 'paid') return { recorded: true, reason: 'already_paid' }

    // Cross-check the Razorpay order amount against the persisted order total.
    try {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
      const rzpOrder = await razorpay.orders.fetch(razorpayOrderId)
      const expectedPaise = Math.round(Number(order.totalAmount || 0) * 100)
      if (Number(rzpOrder?.amount) !== expectedPaise) {
        console.error('[verify-payment] Amount mismatch on writeback', { orderNo, rzpAmount: rzpOrder?.amount, expectedPaise })
        return { recorded: false, reason: 'amount_mismatch' }
      }
    } catch (e) {
      // If the cross-check itself fails, do not block: the signature already
      // proved the payment is genuine. Log and continue.
      console.warn('[verify-payment] Razorpay order fetch failed, recording anyway:', e?.message)
    }

    const patch = {
      payment: {
        ...(order.payment || {}),
        status: 'paid',
        reference: String(paymentId),
        razorpayOrderId: String(razorpayOrderId),
        verifiedAt: new Date().toISOString(),
        metadata: {
          ...(order.payment?.metadata || {}),
          verifiedBy: 'signature',
        },
      },
      updatedAt: new Date(),
    }

    if (order.status === 'pending-payment') {
      patch.status = 'placed'
      const existingHistory = Array.isArray(order.statusHistory) ? order.statusHistory : []
      patch.statusHistory = [
        ...existingHistory,
        { status: 'placed', at: new Date(), actor: `user:${uid}` },
      ]
    }

    await ref.set(patch, { merge: true })
    return { recorded: true }
  } catch (e) {
    console.error('[verify-payment] Paid writeback failed:', e)
    return { recorded: false, reason: 'write_failed' }
  }
}

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded
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
    const { orderId, paymentId, signature, orderNo } = req.body || {}
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing payment verification payload' })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return res.status(500).json({ error: 'Razorpay secret not configured' })
    }

    const payload = `${orderId}|${paymentId}`
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    
    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    const signatureBuffer = Buffer.from(signature, 'hex')
    const valid = expectedBuffer.length === signatureBuffer.length && 
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer)

    if (!valid) {
      return res.status(400).json({ error: 'Invalid payment signature', valid: false })
    }

    // Signature verified — record paid status on the order doc when provided.
    let writeback = null
    if (orderNo) {
      writeback = await recordPaidStatus({
        orderNo,
        razorpayOrderId: orderId,
        paymentId,
        uid: auth.user?.uid || null,
      })
    }

    return res.status(200).json({ valid: true, recorded: writeback?.recorded ?? null, reason: writeback?.reason })
  } catch (err) {
    console.error('verify-payment error', err)
    return res.status(500).json({ error: 'Failed to verify payment' })
  }
}
