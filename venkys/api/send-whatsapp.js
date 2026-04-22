// RE-ENABLE WHEN META DISPLAY NAME APPROVED
/*
import { createRateLimiter } from './lib/rateLimiter.js'

const rateLimiter = createRateLimiter({ routeName: 'send-whatsapp' })

export default async function handler(req, res) {
  const allow = process.env.CORS_ORIGIN || '*'
  const origin = req.headers?.origin || ''
  let allowOrigin = '*'

  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    allowOrigin = origin
  } else if (allow === '*') {
    allowOrigin = origin || '*'
  } else if (origin) {
    const list = allow.split(',').map(s => s.trim()).filter(Boolean)
    if (list.includes(origin)) allowOrigin = origin
    else if (list.length) allowOrigin = list[0]
  }

  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  await rateLimiter(req, res, () => {})
  if (res.headersSent) return

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  try {
    const { phone, payload } = req.body || {}
    const digits = String(phone || '').replace(/\D/g, '')
    if (digits.length !== 10) {
      return res.status(400).json({ error: 'invalid_phone' })
    }

    const token = (process.env.WA_TOKEN || '').trim()
    const phoneNumberId = (process.env.WA_PHONE_NUMBER_ID || '').trim()
    const waApiVersion = (process.env.WA_API_VERSION || 'v21.0').trim()

    const body = {
      messaging_product: 'whatsapp',
      to: `91${digits}`,
      type: 'template',
      template: {
        name: payload?.templateName || process.env.WA_TEMPLATE_DEFAULT_NAME,
        language: { code: payload?.templateLanguage || process.env.WA_TEMPLATE_DEFAULT_LANG },
        components: payload?.components || []
      }
    }

    const url = \`https://graph.facebook.com/\${waApiVersion}/\${phoneNumberId}/messages\`
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: \`Bearer \${token}\`
      },
      body: JSON.stringify(body)
    })
    const data = await r.json().catch(() => ({}))

    if (!r.ok) {
      return res.status(r.status || 400).json({ __error: 'wa_http_error', data })
    }
    return res.status(200).json({ ok: true, data })
  } catch (err) {
    return res.status(500).json({ __error: err.message })
  }
}
*/
