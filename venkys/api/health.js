/* eslint-env node */
// Lightweight health check for APIs.
// GET /api/health
// Returns basic configuration and environment info without exposing secrets.

export default async function handler(req, res) {
  const allow = process.env.CORS_ORIGIN || '*'
  const origin = req.headers?.origin
  let allowOrigin = allow
  let isAllowed = true
  if (allow !== '*' && origin) {
    const list = allow.split(',').map(s => s.trim()).filter(Boolean)
    isAllowed = list.includes(origin)
    allowOrigin = isAllowed ? origin : (list[0] || '')
  }
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
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
