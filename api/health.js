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

  const rawToken = process.env.WA_TOKEN || ''
  const rawPhoneId = process.env.WA_PHONE_NUMBER_ID || ''
  const waToken = rawToken.trim()
  const phoneId = rawPhoneId.trim()
  const phoneIdMasked = phoneId ? `${phoneId.slice(0, 3)}****${phoneId.slice(-3)}` : null

  const payload = {
    ok: true,
    time: new Date().toISOString(),
    env: {
      waToken: waToken ? 'present' : 'missing',
      waPhoneNumberId: phoneId ? 'present' : 'missing',
      waPhoneNumberIdMasked: phoneIdMasked,
      warnings: [
        ...(rawToken !== waToken ? ['WA_TOKEN contains leading/trailing whitespace'] : []),
        ...(rawPhoneId !== phoneId ? ['WA_PHONE_NUMBER_ID contains leading/trailing whitespace'] : []),
      ],
    },
    cors: {
      configured: allow,
      requestOrigin: origin || null,
      allowed: allow === '*' ? true : isAllowed,
    },
    vercel: {
      env: process.env.VERCEL_ENV || null,
      region: process.env.VERCEL_REGION || null,
      url: process.env.VERCEL_URL || null,
    },
    routes: {
      whatsapp: '/api/send-whatsapp',
      sms: '/api/send-sms',
    },
  }

  // Optional WhatsApp probe: verify token access to phone number id
  if (waToken && phoneId) {
    try {
      const u = `https://graph.facebook.com/v21.0/${encodeURIComponent(phoneId)}?fields=display_phone_number,verified_name`
      const r = await fetch(u, { headers: { Authorization: `Bearer ${waToken}` } })
      const data = await r.json().catch(() => ({}))
      payload.waProbe = r.ok
        ? { ok: true, display_phone_number: data.display_phone_number || null, verified_name: data.verified_name || null }
        : { ok: false, status: r.status, error: { type: data?.error?.type, code: data?.error?.code, subcode: data?.error?.error_subcode, message: data?.error?.message } }
    } catch (e) {
      payload.waProbe = { ok: false, error: { message: String(e && e.message || e) } }
    }
  }

  res.status(200).json(payload)
}
