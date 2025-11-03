/* eslint-env node */
// Minimal SMS forwarder (Twilio-compatible). For other providers, adapt the fetch.
// POST body: { phone: "+9198xxxxxx", text: "message" }
// Requires env: SMS_PROVIDER (twilio), TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM

export default async function handler(req, res) {
  const allow = process.env.CORS_ORIGIN || '*'
  const origin = req.headers?.origin
  let allowOrigin = allow
  if (allow !== '*' && origin) {
    const list = allow.split(',').map(s => s.trim()).filter(Boolean)
    if (list.includes(origin)) allowOrigin = origin
    else if (list.length) allowOrigin = list[0]
  }
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  try {
    const provider = process.env.SMS_PROVIDER || 'twilio'
    const { phone, text } = req.body || {}
    const to = String(phone || '').replace(/\D/g, '')
    if (!to || !text) {
      res.status(400).json({ error: 'missing_phone_or_text' })
      return
    }
    if (provider === 'twilio') {
      const sid = process.env.TWILIO_ACCOUNT_SID
      const token = process.env.TWILIO_AUTH_TOKEN
      const from = process.env.TWILIO_FROM
      if (!sid || !token || !from) {
        res.status(200).json({ __skipped: 'missing_server_config', missing: { TWILIO_ACCOUNT_SID: !sid, TWILIO_AUTH_TOKEN: !token, TWILIO_FROM: !from } })
        return
      }
      const auth = Buffer.from(`${sid}:${token}`).toString('base64')
      const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
      const params = new URLSearchParams({ From: from, To: to.startsWith('91') ? `+${to}` : `+91${to}`, Body: text })
      const r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) return res.status(r.status).json({ __error: 'sms_http_error', status: r.status, data })
      return res.status(200).json({ ok: true, data })
    }
    // Add more providers here if needed
    res.status(400).json({ error: 'unsupported_provider' })
  } catch (e) {
    res.status(500).json({ __error: 'server_error', message: String(e && e.message || e) })
  }
}
