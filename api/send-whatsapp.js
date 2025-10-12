// Minimal WhatsApp Cloud API forwarder for Vercel/Node serverless
// POST body: { phone: "+9198xxxxxx", payload?: { text?: string, ...any } | { text: string } }
// Requires env: WA_TOKEN, WA_PHONE_NUMBER_ID

export default async function handler(req, res) {
  // CORS: allow Firebase frontend to call this endpoint
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
      const fallbackLangRaw = (process.env.WA_TEMPLATE_DEFAULT_LANG || 'en_US').replace('-', '_')
      const fallbackLang = fallbackLangRaw.length === 2 ? (fallbackLangRaw.toLowerCase() === 'en' ? 'en_US' : fallbackLangRaw) : fallbackLangRaw
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
      const rawLang = String(payload.templateLanguage || 'en_US').replace('-', '_')
      const lang = rawLang.length === 2 ? (rawLang.toLowerCase() === 'en' ? 'en_US' : rawLang) : rawLang
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
      res.status(r.status).json({ __error: 'wa_http_error', status: r.status, data: r.data, request: { to: body?.to, type: body?.type, template: body?.template ? { name: body.template.name, language: body.template.language } : undefined } })
      return
    }
    res.status(200).json({ ok: true, data: r.data })
  } catch (e) {
    res.status(500).json({ __error: 'server_error', message: String(e && e.message || e) })
  }
}
