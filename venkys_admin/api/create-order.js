/* eslint-env node */
// Vercel Serverless Function: Create Razorpay Order
// Endpoint: /api/create-order
// Method: POST
// Body: { amount: number }
// Returns: { orderId, amount, currency }

import Razorpay from 'razorpay'
import { createRateLimiter } from './lib/rateLimiter.js'
import { verifyAuth } from './lib/verifyAuth.js'
import { handleCors } from './lib/cors.js'

// NOTE: Staff new-order pushes moved to /api/notify-order, which fires after
// the order document is persisted (covers COD orders and uses real order data
// instead of the pre-payment request body).

const rateLimiter = createRateLimiter({ routeName: 'create-order' })

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded
  if (!(process.env.RAZORPAY_KEY_SECRET || '').trim()) {
    return res.status(500).json({ error: 'Server misconfigured: RAZORPAY_KEY_SECRET not set' })
  }
  
  if (handleCors(req, res, 'POST, OPTIONS')) return
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

    return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency })
  } catch (e) {
    console.error('create-order error', e)
    return res.status(500).json({ error: 'Failed to create order' })
  }
}
