/* eslint-env node */
// Minimal WhatsApp Cloud API forwarder for Vercel/Node serverless
// POST body: { phone: "+9198xxxxxx", payload?: { text?: string, ...any } | { text: string } }
// Requires env: WA_TOKEN, WA_PHONE_NUMBER_ID

import { createRateLimiter } from './lib/rateLimiter.js'

const rateLimiter = createRateLimiter({ routeName: 'send-whatsapp' })

export default async function handler(req, res) {
  // CORS: Allow origins from CORS_ORIGIN env (comma-separated), or reflect the request origin if not set
  const allow = process.env.CORS_ORIGIN || ''
  const origin = req.headers?.origin || ''
  let allowOrigin = origin || '*'
  
  // Always allow localhost for development
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    allowOrigin = origin
  } else if (allow && allow !== '*') {
    const list = allow.split(',').map(s => s.trim()).filter(Boolean)
    allowOrigin = list.includes(origin) ? origin : list[0] || '*'
  }
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  // Apply rate limiting
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return // Rate limit exceeded
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
    const { phone, payload, text } = req.body || {}
    const to = String(phone || '').replace(/\D/g, '')
    if (!to) {
      res.status(400).json({ error: 'missing_phone' })
      return
    }
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`

    async function doSend(body) {
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      const data = await r.json().catch(() => ({}))
      return { ok: r.ok, status: r.status, data }
    }

    // Prefer explicit text, otherwise try payload.text, else fallback template if specified
    const msgText = typeof text === 'string' ? text : (payload && typeof payload.text === 'string' ? payload.text : null)

    let body
    if (msgText && !(payload && payload.templateName)) {
      // Case 1: Caller wants to send a simple text. Try text first.
      const textBody = {
        messaging_product: 'whatsapp',
        to: to.startsWith('91') ? to : `91${to}`,
        type: 'text',
        text: { body: msgText },
      }
      // Attempt text
      const first = await doSend(textBody)
      if (first.ok) {
        res.status(200).json({ ok: true, data: first.data })
        return
      }
      // If failed due to 24h window, try template to open a session then retry text
      const code = first.data?.error?.code || first.status
      const msg = (first.data?.error?.message || '').toLowerCase()
      const looksWindow = String(code) === '470' || /24[- ]?hour|no valid whatsapp conversation|outside/i.test(msg)
      if (!looksWindow) {
        res.status(first.status || 400).json({ __error: 'wa_http_error', status: first.status, data: first.data, request: { to: textBody.to, type: textBody.type } })
        return
      }
      // Fallback template send
      const fallbackName = process.env.WA_TEMPLATE_DEFAULT_NAME || 'hello_world'
      const fallbackLang = process.env.WA_TEMPLATE_DEFAULT_LANG || 'en_US'
      const tplBody = {
        messaging_product: 'whatsapp',
        to: textBody.to,
        type: 'template',
        template: { name: fallbackName, language: { code: fallbackLang } },
      }
      const open = await doSend(tplBody)
      if (!open.ok) {
        res.status(open.status || 400).json({ __error: 'wa_template_open_failed', status: open.status, data: open.data, request: { to: tplBody.to, type: 'template', template: tplBody.template } })
        return
      }
      // Retry text after template
      const second = await doSend(textBody)
      if (!second.ok) {
        res.status(second.status || 400).json({ __error: 'wa_http_error_after_template', status: second.status, data: second.data, request: { to: textBody.to, type: textBody.type } })
        return
      }
      res.status(200).json({ ok: true, openedWithTemplate: true, template: { name: fallbackName, language: fallbackLang }, data: second.data })
      return
    } else if (payload && payload.templateName) {
      // Optional template support if caller provides template
      const defaultLang = process.env.WA_TEMPLATE_DEFAULT_LANG || 'en_US'
      const rawLang = String(payload.templateLanguage || defaultLang).replace('-', '_')
      const lang = rawLang // Use the language code as provided, don't auto-convert 'en' to 'en_US'
      body = {
        messaging_product: 'whatsapp',
        to: to.startsWith('91') ? to : `91${to}`,
        type: 'template',
        template: {
          name: payload.templateName,
          language: { code: lang },
          ...(Array.isArray(payload.components) && payload.components.length > 0
            ? { components: payload.components }
            : {}),
        },
      }
    } else {
      res.status(400).json({ error: 'no_content', hint: 'Provide text or templateName in payload' })
      return
    }
    const r = await doSend(body)
    if (!r.ok) {
      try { console.error('[send-whatsapp] WA error', JSON.stringify(r.data)) } catch {}
      res.status(r.status).json({ 
        __error: 'wa_http_error', 
        status: r.status, 
        message: r.data?.error?.message || 'Unknown WA error',
        data: r.data, 
        request: { to: body?.to, type: body?.type, template: body?.template ? { name: body.template.name, language: body.template.language } : undefined } 
      })
      return
    }
    res.status(200).json({ ok: true, data: r.data })
  } catch (e) {
    res.status(500).json({ __error: 'server_error', message: String(e && e.message || e) })
  }
}
