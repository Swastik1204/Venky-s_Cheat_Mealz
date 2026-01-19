/* eslint-env node */
// Vercel Serverless Function: Verify Razorpay Payment Signature
// Endpoint: /api/verify-payment
// Method: POST
// Body: { orderId: string, paymentId: string, signature: string }
// Returns: { valid: boolean }

import crypto from 'crypto'
import { createRateLimiter } from './lib/rateLimiter.js'

const rateLimiter = createRateLimiter({ routeName: 'verify-payment' })

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded
  // CORS: Allow origins from CORS_ORIGIN env (comma-separated), or reflect the request origin if not set
  const allow = process.env.CORS_ORIGIN || ''
  const origin = req.headers?.origin || ''
  let allowOrigin = origin || '*'
  if (allow && allow !== '*') {
    const list = allow.split(',').map(s => s.trim()).filter(Boolean)
    allowOrigin = list.includes(origin) ? origin : list[0] || '*'
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

  try {
    const { orderId, paymentId, signature } = req.body || {}
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing payment verification payload' })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return res.status(500).json({ error: 'Razorpay secret not configured' })
    }

    const payload = `${orderId}|${paymentId}`
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    const valid = expectedSignature === signature

    if (!valid) {
      return res.status(400).json({ error: 'Invalid payment signature', valid: false })
    }

    return res.status(200).json({ valid: true })
  } catch (err) {
    console.error('verify-payment error', err)
    return res.status(500).json({ error: 'Failed to verify payment' })
  }
}
