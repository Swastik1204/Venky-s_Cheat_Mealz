/* eslint-env node */
// Vercel Serverless Function: unauthenticated metadata (health + public config)
//
// Merged health.js + public-config.js into one function — the Vercel Hobby
// plan caps a deployment at 12 serverless functions and venkys_admin was at
// that ceiling. Old paths still work unchanged: vercel.json rewrites
//   /api/health        -> /api/meta?__route=health
//   /api/public-config -> /api/meta?__route=config
// Frontend caller (src/lib/data-payments.js) was not touched.
//
//   __route=health (GET) — liveness probe: { status, app, timestamp }
//   __route=config (GET) — public runtime config for the frontend: { razorpayKeyId }
//
// Each sub-handler is the verbatim body of its former standalone file.

import { createRateLimiter } from './_lib/rateLimiter.js'
import { handleCors } from './_lib/cors.js'

const configLimiter = createRateLimiter({ routeName: 'public-config' })

// ── __route=health (was health.js) — no rate limiter, no auth ──
async function handleHealth(req, res) {
  if (handleCors(req, res, 'GET, OPTIONS')) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return res.status(200).json({
    status: 'ok',
    app: 'venkys-admin',
    timestamp: new Date().toISOString(),
  })
}

// ── __route=config (was public-config.js) ──
// Public (non-secret) runtime config for the frontend.
// Safe to expose: Razorpay Key ID is public.
async function handleConfig(req, res) {
  await configLimiter(req, res, () => {})
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

export default async function handler(req, res) {
  const route = req.query?.__route
  if (route === 'health') return handleHealth(req, res)
  if (route === 'config') return handleConfig(req, res)
  return res.status(404).json({ error: 'Unknown route' })
}
