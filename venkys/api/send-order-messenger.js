/* eslint-env node */
// Dedicated WhatsApp template sender for new online-order notifications (order messenger)
// POST body: { phone: "XXXXXXXXXX", customerName: string, totalAmount: string|number, address: string }
// IMPORTANT: `phone` must be exactly 10 digits (no 91 in DB). Country code is applied at send-time.
// Requires env: WA_TOKEN, WA_PHONE_NUMBER_ID

import { createRateLimiter } from './lib/rateLimiter.js'
import { verifyAuth } from './lib/verifyAuth.js'

const rateLimiter = createRateLimiter({ routeName: 'send-order-messenger' })

function maskPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return 'unknown'
  if (digits.length <= 4) return digits
  return `***${digits.slice(-4)}`
}

export default async function handler(req, res) {
  const allow = process.env.CORS_ORIGIN || ''
  const origin = req.headers?.origin || ''
  let allowOrigin = origin || '*'

  // Always allow localhost for development
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    allowOrigin = origin
  } else if (allow && allow !== '*') {
    const list = allow.split(',').map(s => s.trim()).filter(Boolean)
    allowOrigin = list.includes(origin) ? origin : (list[0] || '*')
  }

  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  await rateLimiter(req, res, () => {})
  if (res.headersSent) return
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
    const waApiVersion = (process.env.WA_API_VERSION || 'v21.0').trim()
    if (!token || !phoneNumberId) {
      res.status(200).json({
        __skipped: 'missing_server_config',
        missing: { WA_TOKEN: !token, WA_PHONE_NUMBER_ID: !phoneNumberId },
      })
      return
    }

    const { phone, customerName, totalAmount, address } = req.body || {}

    const digits = String(phone || '').replace(/\D/g, '')
    if (digits.length !== 10) {
      console.warn('[WA_TRIGGER_B_ORDER_MESSENGER] invalid_phone', { receivedLength: digits.length })
      res.status(400).json({ error: 'invalid_phone', expected: '10_digits', receivedLength: digits.length })
      return
    }

    const to = `91${digits}`

    const name = String(customerName || 'Customer').trim() || 'Customer'
    const totalNum = Number(totalAmount)
    const totalText = Number.isFinite(totalNum)
      ? `₹${totalNum.toFixed(0)}`
      : `₹${String(totalAmount || '').trim() || '0'}`
    const addr = String(address || '-').trim() || '-'

    const templateName = (process.env.WA_TEMPLATE_ORDER_MESSENGER_NAME || 'venkys_order_messenger').trim()
    const templateLang = (process.env.WA_TEMPLATE_ORDER_MESSENGER_LANG || 'en').trim()
    console.info('[WA_TRIGGER_B_ORDER_MESSENGER] start', {
      to: maskPhone(to),
      customerName: name,
      templateName,
      templateLang,
    })

    const url = `https://graph.facebook.com/${waApiVersion}/${phoneNumberId}/messages`
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
      console.error('[WA_TRIGGER_B_ORDER_MESSENGER] failed', { to: maskPhone(to), status: r.status })
      res.status(r.status || 400).json({
        __error: 'wa_http_error',
        status: r.status,
        data,
        request: { to, template: { name: templateName, language: templateLang } },
      })
      return
    }

    console.info('[WA_TRIGGER_B_ORDER_MESSENGER] success', { to: maskPhone(to), templateName })
    res.status(200).json({ ok: true, data })
  } catch (e) {
    console.error('[send-order-messenger] Error:', e)
    res.status(500).json({ __error: 'server_error', message: String(e?.message || e) })
  }
}
