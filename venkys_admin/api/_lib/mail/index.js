/* eslint-env node */
// The only place this app sends email. Every trigger calls sendMail(); SMTP
// transport, retry, [TEST] prefix and logging live in the shared `mailer`
// package (github:Swastik1204/mailer).
//
// Env: SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS (and optional SMTP_FROM).
// The old EMAIL_USER / EMAIL_PASS names are no longer read.
//
// Every send (success or failure) is written to the `mailLog` collection.

import { createMailer, smtpConfigFromEnv, firestoreMailLog } from 'mailwright'
import { adminDb, FieldValue } from '../fcm.js'
import { logAlert } from './logAlert.js'
import { logCleanupReview } from './logCleanupReview.js'
import { staffInvite } from './staffInvite.js'

const TEMPLATES = {
  log_alert: logAlert,
  log_cleanup_review: logCleanupReview,
  staff_invite: staffInvite,
}

// Sender display name per template (same names the old senders used).
const SENDER_NAME = {
  staff_invite: "Venky's Staff",
}
const DEFAULT_SENDER_NAME = "Venky's Alerts"

let mailer = null
let smtp = null

function getMailer() {
  if (mailer) return mailer
  smtp = smtpConfigFromEnv(process.env)
  mailer = createMailer({
    smtp,
    from: smtp.from || `"${DEFAULT_SENDER_NAME}" <${smtp.user}>`,
    templates: TEMPLATES,
    log: firestoreMailLog(adminDb(), FieldValue, { source: 'venkys_admin' }),
  })
  return mailer
}

/** Never throws. Resolves to the mailer result ({ ok, ... }). */
export async function sendMail(templateId, { to, data }) {
  try {
    const m = getMailer()
    // SMTP_FROM, when set, is the sender for every template; the per-template
    // names below are only the fallback when it isn't.
    const name = smtp.from ? null : SENDER_NAME[templateId]
    return await m.send(templateId, { to, data, ...(name ? { from: `"${name}" <${smtp.user}>` } : {}) })
  } catch (err) {
    console.error('[mail] unexpected failure:', err)
    return { ok: false, code: 'unexpected', error: err?.message || String(err), attempts: 0 }
  }
}

export function logRecipient() {
  return (process.env.LOG_EMAIL_RECIPIENT || '').trim()
}
