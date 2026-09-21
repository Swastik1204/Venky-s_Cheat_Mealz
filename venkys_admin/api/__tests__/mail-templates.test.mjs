// Mail templates — regression against the pre-migration HTML.
//
// Run:  node --test venkys_admin/api/__tests__/mail-templates.test.mjs
//
// fixtures/mail-baseline/baseline.json was generated ONCE from the old,
// pre-mailer HTML builders (send-log-email.js, cleanup-logs.js, invites.js at
// origin/main e23cfa8) with the inputs in fixtures/mail-baseline/cases.mjs.
// Each template is rendered here through the real `mailer` core with a fake
// transport, and the subject + HTML it would send must equal the baseline.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createMailer } from 'mailer'
import { logAlert } from '../_lib/mail/logAlert.js'
import { logCleanupReview } from '../_lib/mail/logCleanupReview.js'
import { staffInvite } from '../_lib/mail/staffInvite.js'
import { LOG_CASES, TS, CLEANUP, INVITE } from './fixtures/mail-baseline/cases.mjs'

const baseline = JSON.parse(fs.readFileSync(new URL('./fixtures/mail-baseline/baseline.json', import.meta.url), 'utf8'))

function render(templates) {
  const sent = []
  const mailer = createMailer({
    transport: { sendMail: async (m) => { sent.push(m); return { messageId: 'x' } } },
    from: '"Venky\'s Alerts" <a@b.c>',
    templates,
    testPrefix: false,
  })
  return { mailer, sent }
}

for (const [key, c] of Object.entries(LOG_CASES)) {
  test(`log_alert (${key}) matches pre-migration subject + HTML`, async () => {
    const { mailer, sent } = render({ log_alert: logAlert })
    const r = await mailer.send('log_alert', { to: 'owner@x.com', data: { ...c, timestamp: TS } })
    assert.equal(r.ok, true)
    assert.equal(sent[0].subject, baseline[`log_alert.${key}`].subject)
    assert.equal(sent[0].html, baseline[`log_alert.${key}`].html)
  })
}

test('log_cleanup_review matches pre-migration subject + HTML', async () => {
  const { mailer, sent } = render({ log_cleanup_review: logCleanupReview })
  const r = await mailer.send('log_cleanup_review', { to: 'owner@x.com', data: CLEANUP })
  assert.equal(r.ok, true)
  assert.equal(sent[0].subject, baseline.log_cleanup_review.subject)
  assert.equal(sent[0].html, baseline.log_cleanup_review.html)
})

test('staff_invite matches pre-migration subject + HTML', async () => {
  const { mailer, sent } = render({ staff_invite: staffInvite })
  const r = await mailer.send('staff_invite', { to: 'new@x.com', data: INVITE })
  assert.equal(r.ok, true)
  assert.equal(sent[0].subject, baseline.staff_invite.subject)
  assert.equal(sent[0].html, baseline.staff_invite.html)
})

test('logAlert.js is byte-identical in venkys/ and venkys_admin/ (drift guard)', () => {
  const norm = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
  assert.equal(norm('../_lib/mail/logAlert.js'), norm('../../../venkys/api/_lib/mail/logAlert.js'))
})

test('send-log-email.js is identical in venkys/ and venkys_admin/ (drift guard)', () => {
  const norm = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
  assert.equal(norm('../send-log-email.js'), norm('../../../venkys/api/send-log-email.js'))
})
