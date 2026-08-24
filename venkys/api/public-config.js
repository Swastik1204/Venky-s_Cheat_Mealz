/* eslint-env node */

// Public (non-secret) runtime config for the frontend.
// Safe to expose: Razorpay Key ID is public.

import { createRateLimiter } from './_lib/rateLimiter.js'
import { handleCors } from './_lib/cors.js'

const rateLimiter = createRateLimiter({ routeName: 'public-config' })

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded
  
  if (handleCors(req, res, 'GET, OPTIONS')) return

  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const razorpayKeyId = (process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '').trim()

  res.status(200).json({
    razorpayKeyId,
  })
}
