/* eslint-env node */
// Vercel Serverless Function: Verify Razorpay Payment Signature (staff/POS path)
// Endpoint: /api/verify-payment
// Method: POST
// Body: { orderId: string, paymentId: string, signature: string }
// Returns: { valid: boolean, amount?: number, currency?: string }
//
// SECURITY: this only proves that (orderId, paymentId) is a genuine,
// Razorpay-signed pair — it says nothing about what amount was actually
// captured, or who's allowed to ask. Added the same canAccess(email,
// 'biller') gate place-order.js already uses for POS order creation (this
// file had none), and now looks up the real captured amount from Razorpay
// so a caller doesn't have to trust its own claimed amount either.
//
// This response is informational, not authoritative for writing anything —
// place-order.js's POS branch does NOT trust a client's "verify-payment
// said valid" claim. It independently re-fetches and re-checks the payment
// itself (amount, capture status, orderId match) and atomically claims the
// paymentId before ever persisting an order as paid, because a client could
// otherwise call this endpoint honestly, then separately call place-order.js
// with a fabricated amount/status pair that has nothing to do with what was
// verified here. See place-order.js's use of _lib/posPayment.js.

import crypto from 'crypto'
import Razorpay from 'razorpay'
import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyAuth } from './_lib/verifyAuth.js'
import { handleCors } from './_lib/cors.js'
import { canAccess } from './_lib/fcm.js'

const rateLimiter = createRateLimiter({ routeName: 'verify-payment' })

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded

  if (handleCors(req, res, 'POST, OPTIONS')) return
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  // Verify Firebase Auth token
  const auth = await verifyAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })
  if (!(await canAccess(auth.user?.email, 'biller'))) {
    return res.status(403).json({ error: 'Biller access required' })
  }

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return res.status(500).json({ error: 'Server misconfigured (missing secret)' })
    }
    const keyId = (process.env.RAZORPAY_KEY_ID || '').trim()
    const razorpayMode = keyId.startsWith('rzp_test_') ? 'test' : 'live'
    const { orderId, paymentId, signature } = req.body || {}
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    console.info(`[verify-payment] Razorpay mode=${razorpayMode} verifying orderId=${orderId} staff=${auth.user.email}`)
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expected, 'hex')
    const signatureBuffer = Buffer.from(signature, 'hex')
    const valid = expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
    console.info(`[verify-payment] Razorpay mode=${razorpayMode} valid=${valid}`)
    if (!valid) return res.status(200).json({ valid: false })

    // Signature is genuine — look up what was actually captured so the
    // caller has authoritative data instead of its own claimed amount.
    // Best-effort: a lookup failure doesn't change the signature result.
    try {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: secret })
      const payment = await razorpay.payments.fetch(paymentId)
      return res.status(200).json({
        valid: true,
        amount: Number(payment.amount) / 100,
        currency: payment.currency,
        status: payment.status,
      })
    } catch (lookupErr) {
      console.warn('[verify-payment] payment lookup failed, returning signature result only:', lookupErr.message)
      return res.status(200).json({ valid: true })
    }
  } catch (e) {
    console.error('verify-payment error', e)
    return res.status(500).json({ error: 'Verification failed' })
  }
}
