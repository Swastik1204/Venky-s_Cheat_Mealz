/* eslint-env node */
// Vercel Serverless Function: Create Razorpay Order
// Endpoint: /api/create-order
// Method: POST
// Body: { amount: number }
// Returns: { orderId, amount, currency }

import Razorpay from 'razorpay'
import { createRateLimiter } from './lib/rateLimiter.js'
import { verifyAuth } from './lib/verifyAuth.js'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

// Initialize Firebase Admin (singleton)
if (!getApps().length) {
  const sa = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim()
  if (sa) {
    try { initializeApp({ credential: cert(JSON.parse(sa)) }) } catch { initializeApp() }
  } else {
    initializeApp()
  }
}

async function sendFCMToStaff(db, orderData) {
  // Fetch all FCM tokens from the fcmTokens collection
  const tokensSnap = await db.collection('fcmTokens').get()
  if (tokensSnap.empty) {
    ;(/* removed log */ () => {})('[FCM] No FCM tokens registered')
    return
  }
  const tokens = tokensSnap.docs.map(d => d.data().token).filter(Boolean)
  if (!tokens.length) return

  const message = {
    tokens: tokens,
    data: {
      type: 'new_order',
      orderNo: String(orderData.orderNo || ''),
      orderType: String(orderData.orderType || 'online'),
      customerName: String(orderData.customer?.name || 'Customer'),
      total: String(orderData.totalAmount || orderData.amount || 0),
      isDineInCod: String(orderData.orderType === 'dine-in' && orderData.payment?.method === 'cod'),
    },
    notification: {
      title: orderData.orderType === 'dine-in' ? '🚨 New Dine-in Order' : '🛒 New Online Order',
      body: `${orderData.customer?.name || 'Customer'} • ₹${orderData.totalAmount || orderData.amount || ''}`,
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        defaultSound: true,
      }
    }
  }

  try {
    const response = await getMessaging().sendEachForMulticast(message)
    ;(/* removed log */ () => {})('[FCM] Push result:', response.successCount, 'failures:', response.failureCount)
  } catch (error) {
    console.error('[FCM] Error sending message:', error)
  }
}

const rateLimiter = createRateLimiter({ routeName: 'create-order' })

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded
  if (!(process.env.RAZORPAY_KEY_SECRET || '').trim()) {
    return res.status(500).json({ error: 'Server misconfigured: RAZORPAY_KEY_SECRET not set' })
  }
  // CORS: Allow origins from CORS_ORIGIN env (comma-separated), or reflect the request origin if not set
  const allow = process.env.CORS_ORIGIN || ''
  const origin = req.headers?.origin || ''
  let allowOrigin = origin || '*'
  if (allow && allow !== '*') {
    const list = allow.split(',').map(s => s.trim()).filter(Boolean)
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
    if (list.includes(origin)) allowOrigin = origin
    else if (isLocalhost) allowOrigin = origin
    else if (list.length) allowOrigin = list[0]
  }
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  // Verify Firebase Auth token
  const auth = await verifyAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  try {
    const keyId = (process.env.RAZORPAY_KEY_ID || '').trim()
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim()
    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Payment gateway not configured' })
    }
    const razorpayMode = keyId.startsWith('rzp_test_') ? 'test' : 'live'

    const { amount } = req.body || {}
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    // Server-side amount ceiling to prevent abuse (max ₹50,000 per order)
    const MAX_ORDER_AMOUNT = 50000
    if (Number(amount) > MAX_ORDER_AMOUNT) {
      return res.status(400).json({ error: 'Amount exceeds maximum order limit', maxAmount: MAX_ORDER_AMOUNT })
    }

    console.info(`[create-order] Razorpay mode=${razorpayMode} amount=${Number(amount)} source=admin_pos`)

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

    const options = {
      amount: Math.round(Number(amount) * 100), // in paise
      currency: 'INR',
      receipt: 'pos_rcpt_' + Date.now(),
      notes: { source: 'admin_pos' }
    }

    const order = await razorpay.orders.create(options)
    console.info(`[create-order] Razorpay order created mode=${razorpayMode} orderId=${order.id}`)
    
    try {
      sendFCMToStaff(getFirestore(), req.body || {}).catch(() => {})
    } catch (e) {}

    return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency })
  } catch (e) {
    console.error('create-order error', e)
    return res.status(500).json({ error: 'Failed to create order' })
  }
}
