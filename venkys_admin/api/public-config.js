/* eslint-env node */

// Public (non-secret) runtime config for the frontend.
// Safe to expose: Razorpay Key ID is public.

import { createRateLimiter } from './lib/rateLimiter.js'

const rateLimiter = createRateLimiter({ routeName: 'public-config' })

export default async function handler(req, res) {
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded
  // CORS: allow all origins (public config)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

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
