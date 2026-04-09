/* eslint-env node */
// Minimal WhatsApp Cloud API forwarder for Vercel/Node serverless
// POST body: { phone: "+9198xxxxxx", payload?: { text?: string, ...any } | { text: string } }
// Requires env: WA_TOKEN, WA_PHONE_NUMBER_ID

import { createRateLimiter } from './lib/rateLimiter.js'
import { verifyAuth } from './lib/verifyAuth.js'

const rateLimiter = createRateLimiter({ routeName: 'send-whatsapp' })

function maskPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return 'unknown'
  if (digits.length <= 4) return digits
  return `***${digits.slice(-4)}`
}

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
  if (!(process.env.WA_TOKEN || '').trim()) {
    return res.status(500).json({ error: 'Server misconfigured: WA_TOKEN not set' })
  }
  if (!(process.env.WA_PHONE_NUMBER_ID || '').trim()) {
    return res.status(500).json({ error: 'Server misconfigured: WA_PHONE_NUMBER_ID not set' })
  }
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
    const { phone, payload, text } = req.body || {}
    const to = String(phone || '').replace(/\D/g, '')
    if (!to || to.length < 10) {
      console.warn('[WA_TRIGGER_API_SEND_WHATSAPP] invalid_phone', { received: String(phone || '') })
      res.status(400).json({ error: 'invalid_phone', expected: 'at_least_10_digits' })
      return
    }
    const url = `https://graph.facebook.com/${waApiVersion}/${phoneNumberId}/messages`
    const resolvedTo = to.startsWith('91') ? to : `91${to}`

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
    console.info('[WA_TRIGGER_API_SEND_WHATSAPP] start', {
      to: maskPhone(resolvedTo),
      hasText: !!msgText,
      hasTemplate: !!(payload && payload.templateName),
    })

    let body
    if (msgText && !(payload && payload.templateName)) {
      // Case 1: Caller wants to send a simple text. Try text first.
      const textBody = {
        messaging_product: 'whatsapp',
        to: resolvedTo,
        type: 'text',
        text: { body: msgText },
      }
      // Attempt text
      const first = await doSend(textBody)
      if (first.ok) {
        console.info('[WA_TRIGGER_API_SEND_WHATSAPP] text_success', { to: maskPhone(textBody.to) })
        res.status(200).json({ ok: true, data: first.data })
        return
      }
      // If failed due to 24h window, try template to open a session then retry text
      const code = first.data?.error?.code || first.status
      const msg = (first.data?.error?.message || '').toLowerCase()
      const looksWindow = String(code) === '470' || /24[- ]?hour|no valid whatsapp conversation|outside/i.test(msg)
      if (!looksWindow) {
        console.warn('[WA_TRIGGER_API_SEND_WHATSAPP] text_failed_non_window', {
          to: maskPhone(textBody.to),
          status: first.status,
          code,
        })
        res.status(first.status || 400).json({ __error: 'wa_http_error', status: first.status, data: first.data, request: { to: textBody.to, type: textBody.type } })
        return
      }
      // Fallback template send
      const fallbackName = process.env.WA_TEMPLATE_DEFAULT_NAME || 'hello_world'
      const fallbackLang = process.env.WA_TEMPLATE_DEFAULT_LANG || 'en_US'
      // Default fallback template — hello_world is Meta's built-in test template
      // Set WA_TEMPLATE_DEFAULT_NAME in env to override for production
      const tplBody = {
        messaging_product: 'whatsapp',
        to: textBody.to,
        type: 'template',
        template: { name: fallbackName, language: { code: fallbackLang } },
      }
      const open = await doSend(tplBody)
      if (!open.ok) {
        console.error('[WA_TRIGGER_API_SEND_WHATSAPP] template_open_failed', { to: maskPhone(tplBody.to), status: open.status })
        res.status(open.status || 400).json({ __error: 'wa_template_open_failed', status: open.status, data: open.data, request: { to: tplBody.to, type: 'template', template: tplBody.template } })
        return
      }
      // Retry text after template
      const second = await doSend(textBody)
      if (!second.ok) {
        console.error('[WA_TRIGGER_API_SEND_WHATSAPP] text_retry_failed', { to: maskPhone(textBody.to), status: second.status })
        res.status(second.status || 400).json({ __error: 'wa_http_error_after_template', status: second.status, data: second.data, request: { to: textBody.to, type: textBody.type } })
        return
      }
      console.info('[WA_TRIGGER_API_SEND_WHATSAPP] text_retry_success', { to: maskPhone(textBody.to), template: fallbackName })
      res.status(200).json({ ok: true, openedWithTemplate: true, template: { name: fallbackName, language: fallbackLang }, data: second.data })
      return
    } else if (payload && payload.templateName) {
      // Optional template support if caller provides template
      const defaultLang = process.env.WA_TEMPLATE_DEFAULT_LANG || 'en_US'
      const rawLang = String(payload.templateLanguage || defaultLang).replace('-', '_')
      const lang = rawLang // Use the language code as provided, don't auto-convert 'en' to 'en_US'
      
      // Log template-specific parameters for debugging
      if (payload.templateName === 'venkys_bill' && Array.isArray(payload.components?.[0]?.parameters)) {
        const params = payload.components[0].parameters
        const p1 = params[0]?.text || ''
        const p2 = params[1]?.text || ''
        const p3 = params[2]?.text || ''
        const p4 = params[3]?.text || ''
        console.log('[send-whatsapp] bill_params', { p1, p2, p3, p4 })
      }
      
      body = {
        messaging_product: 'whatsapp',
        to: resolvedTo,
        type: 'template',
        template: {
          name: payload.templateName,
          language: { code: lang },
          ...(Array.isArray(payload.components) && payload.components.length > 0
            ? { components: payload.components }
            : {}),
        },
      }
      console.info('[WA_TRIGGER_API_SEND_WHATSAPP] template_send_attempt', { to: maskPhone(body.to), template: payload.templateName, lang })
    } else {
      res.status(400).json({ error: 'no_content', hint: 'Provide text or templateName in payload' })
      return
    }
    const r = await doSend(body)
    if (!r.ok) {
      try { console.error('[send-whatsapp] WA error', JSON.stringify(r.data)) } catch {}
      console.error('[WA_TRIGGER_API_SEND_WHATSAPP] failed', { to: maskPhone(body?.to), status: r.status, type: body?.type })
      res.status(r.status).json({ 
        __error: 'wa_http_error', 
        status: r.status, 
        message: r.data?.error?.message || 'Unknown WA error',
        data: r.data, 
        request: { to: body?.to, type: body?.type, template: body?.template ? { name: body.template.name, language: body.template.language } : undefined } 
      })
      return
    }
    console.info('[WA_TRIGGER_API_SEND_WHATSAPP] success', { to: maskPhone(body?.to), type: body?.type })
    res.status(200).json({ ok: true, data: r.data })
  } catch (e) {
    console.error('[WA_TRIGGER_API_SEND_WHATSAPP] server_error', String(e && e.message || e))
    res.status(500).json({ __error: 'server_error', message: String(e && e.message || e) })
  }
}
