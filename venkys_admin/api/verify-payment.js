/* eslint-env node */
// Vercel Serverless Function: Verify Razorpay Payment Signature
// Endpoint: /api/verify-payment
// Method: POST
// Body: { orderId: string, paymentId: string, signature: string }
// Returns: { valid: boolean }

import crypto from 'crypto'
import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyAuth } from './_lib/verifyAuth.js'
import { handleCors } from './_lib/cors.js'

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
    console.info(`[verify-payment] Razorpay mode=${razorpayMode} verifying orderId=${orderId}`)
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
    return res.status(200).json({ valid })
  } catch (e) {
    console.error('verify-payment error', e)
    return res.status(500).json({ error: 'Verification failed' })
  }
}
