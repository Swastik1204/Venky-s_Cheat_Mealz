/* eslint-env node */
// Lightweight health check for APIs.
// GET /api/health
// Returns basic configuration and environment info without exposing secrets.

import { handleCors } from './lib/cors.js'

export default async function handler(req, res) {
  if (handleCors(req, res, 'GET, OPTIONS')) return
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }

  return res.status(200).json({
    ok: true,
    status: 'healthy',
    app: 'venkys-customer',
    timestamp: new Date().toISOString()
  })
}
