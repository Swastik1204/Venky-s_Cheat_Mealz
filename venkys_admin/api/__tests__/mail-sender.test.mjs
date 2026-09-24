// Sender identity — SMTP_FROM wins when set; the hardcoded names are only the fallback.
//
// Run:  node --test venkys_admin/api/__tests__/mail-sender.test.mjs
//
// Drives the real _lib/mail/index.js (real mailer + nodemailer) against a local
// SMTP sink. Only ../fcm.js (Firebase) is stubbed. Each case re-imports the
// module with a cache-busting query so its lazily-created mailer is fresh.

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'
import { startSink } from './fixtures/smtp-sink.mjs'

let sink
before(async () => {
  register('./fixtures/mail-sender.loader.mjs', import.meta.url)
  sink = await startSink()
})
after(() => sink.server.close())

async function sendWith(env, templateId, data) {
  for (const k of ['SMTP_FROM', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_USER', 'EMAIL_PASS']) delete process.env[k]
  Object.assign(process.env, { SMTP_HOST: '127.0.0.1', SMTP_PORT: String(sink.port), SMTP_USER: 'box@example.com', SMTP_PASS: 'x' }, env)
  const { sendMail } = await import(`../_lib/mail/index.js?case=${Math.random()}`)
  const before = sink.messages.length
  const r = await sendMail(templateId, { to: 'owner@example.com', data })
  assert.equal(r.ok, true, JSON.stringify(r))
  return sink.messages[before].match(/^From: (.*)$/m)[1]
}

const LOG = { type: 'roles_update', message: 'test', metadata: {} }
const INVITE = { inviteUrl: 'https://x/claim?token=t', role: 'staff', invitedByName: 'Owner', expiresAt: new Date('2026-09-23T00:00:00Z') }

test('old EMAIL_USER/EMAIL_PASS alone are no longer used (fallback removed)', async () => {
  for (const k of ['SMTP_FROM', 'SMTP_USER', 'SMTP_PASS']) delete process.env[k]
  Object.assign(process.env, { SMTP_HOST: '127.0.0.1', SMTP_PORT: String(sink.port), EMAIL_USER: 'old@example.com', EMAIL_PASS: 'x' })
  const { sendMail } = await import(`../_lib/mail/index.js?case=${Math.random()}`)
  const before = sink.messages.length
  const r = await sendMail('log_alert', { to: 'owner@example.com', data: LOG })
  assert.equal(r.ok, false)
  assert.equal(r.code, 'not_configured')
  assert.equal(sink.messages.length, before, 'nothing may be sent')
  delete process.env.EMAIL_USER
  delete process.env.EMAIL_PASS
})

test('SMTP_FROM unset: log alerts keep "Venky\'s Alerts"', async () => {
  assert.equal(await sendWith({}, 'log_alert', LOG), `"Venky's Alerts" <box@example.com>`)
})

test('SMTP_FROM unset: invites keep "Venky\'s Staff"', async () => {
  assert.equal(await sendWith({}, 'staff_invite', INVITE), `"Venky's Staff" <box@example.com>`)
})

test('SMTP_FROM set: used for log alerts', async () => {
  assert.equal(await sendWith({ SMTP_FROM: '"Custom Sender" <box@example.com>' }, 'log_alert', LOG), 'Custom Sender <box@example.com>')
})

test('SMTP_FROM set: used for invites too (overrides the per-template name)', async () => {
  assert.equal(await sendWith({ SMTP_FROM: '"Custom Sender" <box@example.com>' }, 'staff_invite', INVITE), 'Custom Sender <box@example.com>')
})
