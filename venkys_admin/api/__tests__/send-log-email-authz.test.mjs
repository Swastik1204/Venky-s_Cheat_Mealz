// send-log-email authorization — runs the REAL handler in-process.
//
// Run:  node --test venkys_admin/api/__tests__/send-log-email-authz.test.mjs
//
// Dependencies (auth, staff lookup, nodemailer, rate limiter, CORS) are swapped
// for stubs by fixtures/send-log-email.loader.mjs; the handler file itself is
// imported unmodified. "Zero email sent" = nodemailer's sendMail never called.

import { test, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'

let handler
before(async () => {
  register('./fixtures/send-log-email.loader.mjs', import.meta.url)
  process.env.EMAIL_USER = 'alerts@example.com'
  process.env.EMAIL_PASS = 'x'
  process.env.LOG_EMAIL_RECIPIENT = 'owner@example.com'
  ;({ default: handler } = await import('../send-log-email.js'))
})

beforeEach(() => {
  globalThis.__sle = { internal: false, auth: {}, staffEmails: ['staff@example.com'], staffChecks: [], sent: [] }
})

function call() {
  const res = {
    statusCode: 200, body: null, headersSent: false,
    status(c) { this.statusCode = c; return this },
    json(b) { this.body = b; this.headersSent = true; return this },
    setHeader() {},
  }
  const req = { method: 'POST', headers: {}, body: { type: 'roles_create', message: 'test' } }
  return handler(req, res).then(() => res)
}

test('signed-in NON-staff user gets 403 and no email is sent', async () => {
  __sle.auth = { user: { email: 'customer@example.com' }, roleEmail: 'customer@example.com' }
  const res = await call()
  assert.equal(res.statusCode, 403)
  assert.deepEqual(res.body, { error: 'Staff access required' })
  assert.equal(__sle.sent.length, 0)
})

test('unverified email (roleEmail null) gets 403 and no email is sent', async () => {
  __sle.auth = { user: { email: 'staff@example.com' }, roleEmail: null }
  const res = await call()
  assert.equal(res.statusCode, 403)
  assert.equal(__sle.sent.length, 0)
})

test('staff caller still sends exactly one email', async () => {
  __sle.auth = { user: { email: 'staff@example.com' }, roleEmail: 'staff@example.com' }
  const res = await call()
  assert.equal(res.statusCode, 200)
  assert.equal(__sle.sent.length, 1)
  assert.equal(__sle.sent[0].to, 'owner@example.com')
})

test('internal-secret caller (rate limiter) skips the staff check and still sends', async () => {
  __sle.internal = true
  const res = await call()
  assert.equal(res.statusCode, 200)
  assert.equal(__sle.staffChecks.length, 0)
  assert.equal(__sle.sent.length, 1)
})

test('auth failure still returns its own status before any staff check', async () => {
  __sle.auth = { error: 'Unauthorized', status: 401 }
  const res = await call()
  assert.equal(res.statusCode, 401)
  assert.equal(__sle.staffChecks.length, 0)
  assert.equal(__sle.sent.length, 0)
})
