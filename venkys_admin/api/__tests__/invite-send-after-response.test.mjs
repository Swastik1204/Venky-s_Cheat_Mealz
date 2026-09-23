// Staff invite responds BEFORE the email send finishes.
//
// Run:  node --test venkys_admin/api/__tests__/invite-send-after-response.test.mjs
//
// Runs the real invites.js 'create' action with its dependencies stubbed. The
// stubbed sendMail never resolves until the test releases it (a slow SMTP
// server). The handler must still respond 200 immediately and hand the send to
// waitUntil, so the admin UI's 30s timeout no longer misreports success.

import { test, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'

let handler
before(async () => {
  register('./fixtures/invite-send-after-response.loader.mjs', import.meta.url)
  ;({ default: handler } = await import('../invites.js'))
})
beforeEach(() => { globalThis.__inv = { writes: [], sendStarted: [], waitedOn: [], releaseSend: null } })

function call() {
  const res = {
    statusCode: 200, body: null, headersSent: false,
    status(c) { this.statusCode = c; return this },
    json(b) { this.body = b; this.headersSent = true; return this },
    setHeader() {},
  }
  const req = { method: 'POST', headers: {}, query: {}, body: { action: 'create', email: 'new@example.com', role: 'staff' } }
  return handler(req, res).then(() => res)
}

test('responds 200 while the email is still sending, and hands the send to waitUntil', async () => {
  const res = await Promise.race([call(), new Promise((_, rej) => setTimeout(() => rej(new Error('handler waited for the send')), 2000))])
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.ok, true)
  assert.ok(res.body.token)
  const inv = globalThis.__inv
  assert.equal(inv.sendStarted.length, 1, 'send must have been started')
  assert.equal(inv.sendStarted[0].templateId, 'staff_invite')
  assert.equal(inv.sendStarted[0].to, 'new@example.com')
  assert.equal(inv.waitedOn.length, 1, 'send must be handed to waitUntil')
  assert.ok(inv.writes.some((w) => w.name === 'staffInvites'), 'invite doc written before responding')
  inv.releaseSend({ ok: true })
  await inv.waitedOn[0]
})

test('a failed send after responding is still handled (no unhandled rejection)', async () => {
  const res = await call()
  assert.equal(res.statusCode, 200)
  const inv = globalThis.__inv
  inv.releaseSend({ ok: false, code: 'EAUTH', error: 'bad auth' })
  await assert.doesNotReject(inv.waitedOn[0])
})
