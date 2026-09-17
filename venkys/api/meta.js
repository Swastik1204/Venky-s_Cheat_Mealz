/* eslint-env node */
// Vercel Serverless Function: unauthenticated metadata (health + public config)
//
// Merged health.js + public-config.js into one function to optimize function count.
// Old paths still work unchanged: vercel.json rewrites
//   /api/health        -> /api/meta?__route=health
//   /api/public-config -> /api/meta?__route=config
//
//   __route=health (GET) — liveness probe: { ok, status, app, timestamp }
//   __route=config (GET) — public runtime config for the frontend: { razorpayKeyId }

import { createRateLimiter } from './_lib/rateLimiter.js'
import { handleCors } from './_lib/cors.js'

const configLimiter = createRateLimiter({ routeName: 'public-config' })

async function handleHealth(req, res) {
  if (handleCors(req, res, 'GET, OPTIONS')) return
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  return res.status(200).json({
    ok: true,
    status: 'healthy',
    app: 'venkys-customer',
    timestamp: new Date().toISOString()
  })
}

async function handleConfig(req, res) {
  await configLimiter(req, res, () => {})
  if (res.headersSent) return

  if (handleCors(req, res, 'GET, OPTIONS')) return

  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const razorpayKeyId = (process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '').trim()

  return res.status(200).json({
    razorpayKeyId,
  })
}

export default async function handler(req, res) {
  const route = req.query?.__route
  if (route === 'health') return handleHealth(req, res)
  if (route === 'config') return handleConfig(req, res)
  return res.status(404).json({ error: 'Unknown route' })
}
