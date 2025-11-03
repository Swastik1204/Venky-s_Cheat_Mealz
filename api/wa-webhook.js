/* eslint-env node */
// WhatsApp Cloud API webhook receiver
// - Verification: GET with hub.mode, hub.verify_token, hub.challenge
// - Events: POST JSON with messages/statuses

export default async function handler(req, res) {
  // Verification
  if (req.method === 'GET') {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']
    const verify = process.env.WA_VERIFY_TOKEN || ''
    if (mode === 'subscribe' && token && token === verify) {
      res.status(200).send(challenge)
    } else {
      res.status(403).send('Forbidden')
    }
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }

  try {
    const payload = req.body || {}
    // Minimal logging of statuses and messages; visible in Vercel logs
    if (Array.isArray(payload.entry)) {
      for (const entry of payload.entry) {
        const changes = entry.changes || []
        for (const ch of changes) {
          const v = ch.value || {}
          const messages = v.messages || []
          const statuses = v.statuses || []
          if (messages.length) {
            console.log('[wa-webhook] messages', JSON.stringify(messages))
          }
          if (statuses.length) {
            console.log('[wa-webhook] statuses', JSON.stringify(statuses))
          }
        }
      }
    }
    res.status(200).json({ ok: true })
  } catch (e) {
    console.error('[wa-webhook] error', e)
    res.status(200).json({ ok: true }) // Always 200 to avoid retries storm
  }
}
