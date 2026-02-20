/* eslint-env node */
// Dedicated WhatsApp template sender for new online-order notifications (order_messenger)
// POST body: { phone: "+9198xxxxxx" | "9198xxxxxx", customerName: string, totalAmount: string|number, address: string }
// Requires env: WA_TOKEN, WA_PHONE_NUMBER_ID

import { createRateLimiter } from './lib/rateLimiter.js'
import { verifyAuth } from './lib/verifyAuth.js'

const rateLimiter = createRateLimiter({ routeName: 'send-order-messenger' })

export default async function handler(req, res) {
  // CORS: allow Firebase frontend to call this endpoint
  const allow = process.env.CORS_ORIGIN || '*'
  const origin = req.headers?.origin || ''
  let allowOrigin = '*'
  
  // Always allow localhost for development
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
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded
  // Verify Firebase Auth token
  const auth = await verifyAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  try {
    const token = (process.env.WA_TOKEN || '').trim()
    const phoneNumberId = (process.env.WA_PHONE_NUMBER_ID || '').trim()
    if (!token || !phoneNumberId) {
      res.status(200).json({ __skipped: 'missing_server_config', missing: { WA_TOKEN: !token, WA_PHONE_NUMBER_ID: !phoneNumberId } })
      return
    }

    const { phone, customerName, totalAmount, address } = req.body || {}
    const digits = String(phone || '').replace(/\D/g, '')
    // STRICT: settings store and client send 10-digit numbers only (no 91 in DB)
    if (digits.length !== 10) {
      res.status(400).json({ error: 'invalid_phone', expected: '10_digits', receivedLength: digits.length })
      return
    }
    // WhatsApp Cloud API requires country code at send time.
    const to = `91${digits}`

    const name = String(customerName || 'Customer').trim() || 'Customer'
    const totalNum = Number(totalAmount)
    const totalText = Number.isFinite(totalNum) ? `₹${totalNum.toFixed(0)}` : `₹${String(totalAmount || '').trim() || '0'}`
    const addr = String(address || '-').trim() || '-'

    const templateName = process.env.WA_TEMPLATE_ORDER_MESSENGER_NAME || 'venkys_order_messenger'
    const templateLang = process.env.WA_TEMPLATE_ORDER_MESSENGER_LANG || 'en'

    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLang },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: name },
              { type: 'text', text: totalText },
              { type: 'text', text: addr },
            ],
          },
        ],
      },
    }

    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      res.status(r.status || 400).json({ __error: 'wa_http_error', status: r.status, data, request: { to, template: { name: templateName, language: templateLang } } })
      return
    }

    res.status(200).json({ ok: true, data })
  } catch (e) {
    res.status(500).json({ __error: 'server_error', message: String(e && e.message || e) })
  }
}
