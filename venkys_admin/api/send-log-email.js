/* eslint-env node */
// Email notification API for log events
// POST body: { type: string, message: string, metadata: object }
// Sends the log_alert template through the shared mailer (_lib/mail).
// Requires env: SMTP_USER / SMTP_PASS and LOG_EMAIL_RECIPIENT. The recipient is always chosen
// here on the server — callers never supply an address.

import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyAuth, verifyInternalSecret } from './_lib/verifyAuth.js'
import { handleCors } from './_lib/cors.js'
import { isStaffEmail } from './_lib/fcm.js'
import { sendMail, logRecipient } from './_lib/mail/index.js'

const rateLimiter = createRateLimiter({ routeName: 'send-log-email' })

export default async function handler(req, res) {
  // Apply rate limiting (20 emails per minute max to avoid spam)
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return

  if (handleCors(req, res, 'POST, OPTIONS')) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  // Accept either Firebase Auth or internal API secret (for server-to-server calls)
  const isInternal = verifyInternalSecret(req)
  if (!isInternal) {
    const auth = await verifyAuth(req)
    if (auth.error) return res.status(auth.status).json({ error: auth.error })
    // Any signed-in user is not enough: this sends mail as the business. Require a
    // staff/admin role on a verified email (roleEmail is null for unverified tokens).
    if (!(await isStaffEmail(auth.roleEmail))) {
      return res.status(403).json({ error: 'Staff access required' })
    }
  }

  const emailRecipient = logRecipient()
  if (!emailRecipient) {
    console.error('[send-log-email] Missing LOG_EMAIL_RECIPIENT - logs will not be sent')
    return res.status(500).json({ error: 'Email not configured' })
  }

  const { type, message, metadata } = req.body || {}

  if (!type || !message) {
    return res.status(400).json({ error: 'missing_required_fields' })
  }

  // Enforce payload size limits
  if (String(message).length > 5000) {
    return res.status(400).json({ error: 'message_too_long', maxLength: 5000 })
  }
  const metadataStr = metadata ? JSON.stringify(metadata, null, 2) : ''
  if (metadataStr.length > 10000) {
    return res.status(400).json({ error: 'metadata_too_large', maxLength: 10000 })
  }

  const result = await sendMail('log_alert', {
    to: emailRecipient,
    data: { type, message: String(message), metadata },
  })
  if (!result.ok) {
    console.error('[send-log-email] send failed:', result.code, result.error)
    const notConfigured = result.code === 'not_configured'
    return res.status(500).json({ error: notConfigured ? 'Email not configured' : 'Failed to send email' })
  }
  return res.status(200).json({ ok: true, messageId: result.messageId })
}
