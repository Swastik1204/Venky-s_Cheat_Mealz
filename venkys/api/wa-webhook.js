/* eslint-env node */
// WhatsApp Cloud API webhook receiver
// - Verification: GET with hub.mode, hub.verify_token, hub.challenge
// - Events: POST JSON with messages/statuses

import crypto from 'crypto'
import { createRateLimiter } from './lib/rateLimiter.js'

const rateLimiter = createRateLimiter({ routeName: 'wa-webhook' })

/**
 * Verify the X-Hub-Signature-256 header from Meta/WhatsApp webhook events.
 * Returns false if no app secret is configured (fail-closed for security).
 */
function verifyWebhookSignature(req) {
  const appSecret = process.env.WA_APP_SECRET
  if (!appSecret) return false // Fail-closed: reject if not configured

  const signature = req.headers['x-hub-signature-256']
  if (!signature) return false

  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  // Apply rate limiting (only for POST, skip for GET verification)
  if (req.method === 'POST') {
    await rateLimiter(req, res, () => {})
    if (res.headersSent) return // Rate limit exceeded
  }
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

  // Verify webhook signature (Meta best practice)
  if (!verifyWebhookSignature(req)) {
    res.status(401).json({ ok: false, error: 'invalid_signature' })
    return
  }

  try {
    const payload = req.body || {}
    if (Array.isArray(payload.entry)) {
      for (const entry of payload.entry) {
        const changes = entry.changes || []
        for (const ch of changes) {
          const v = ch.value || {}
          const messages = v.messages || []
          const statuses = v.statuses || []
          if (messages.length) {
            // Log count only — no PII
            console.log(`[wa-webhook] received ${messages.length} message(s)`)
          }
          if (statuses.length) {
            console.log(`[wa-webhook] received ${statuses.length} status update(s)`)
            // TODO: update order delivery status in Firestore based on statuses array
            // Each status contains: id (message id), timestamp, status (sent/delivered/read), recipient_id (phone)
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
