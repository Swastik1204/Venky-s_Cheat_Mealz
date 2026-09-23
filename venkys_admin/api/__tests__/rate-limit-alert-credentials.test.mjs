// Rate-limit alert on a function that never loaded fcm.js (e.g. public-config).
//
// Run:  node --test venkys_admin/api/__tests__/rate-limit-alert-credentials.test.mjs
//
// Imports the real meta.js (and through it the real _lib/rateLimiter.js) in a
// fresh process — like an isolated Vercel function — and pushes
// /api/public-config past its limit. Before the fix, the violation called a
// bare initializeApp() with no credentials, the logs write failed on Vercel,
// and the alert email was never sent. After it, the credentialed adminDb()
// from fcm.js is used and the alert goes out.

import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'

let handler
before(async () => {
  register('./fixtures/rate-limit-alert.loader.mjs', import.meta.url)
  globalThis.__rl = { adminDbCalls: 0, bareInitCalls: 0, logWrites: [], mails: [], waited: [] }
  process.env.NODE_ENV = 'production'           // violations are only logged in production
  delete process.env.UPSTASH_REDIS_REST_URL     // in-memory limiter
  delete process.env.UPSTASH_REDIS_REST_TOKEN
  ;({ default: handler } = await import('../meta.js'))
})

function call() {
  const res = {
    statusCode: 200, headersSent: false, headers: {},
    status(c) { this.statusCode = c; return this },
    json() { this.headersSent = true; return this },
    send() { this.headersSent = true; return this },
    end() { this.headersSent = true; return this },
    setHeader(k, v) { this.headers[k] = v },
    getHeader(k) { return this.headers[k] },
  }
  const req = { method: 'GET', url: '/api/public-config', query: { __route: 'config' }, headers: { 'x-forwarded-for': '203.0.113.7' }, socket: { remoteAddress: '203.0.113.7' } }
  return Promise.resolve(handler(req, res)).then(() => res)
}

test('public-config violation uses credentialed adminDb and sends the alert', async () => {
  let hit429 = false
  for (let i = 0; i < 400 && !hit429; i++) hit429 = (await call()).statusCode === 429
  assert.ok(hit429, 'expected the limiter to return 429')
  // The violation work must be registered with waitUntil — on Vercel, work
  // left running after the 429 is otherwise dropped when the instance idles.
  const rl0 = globalThis.__rl
  assert.ok(rl0.waited.length >= 1, 'violation logging must be handed to waitUntil')
  await Promise.all(rl0.waited)

  const rl = globalThis.__rl
  assert.equal(rl.bareInitCalls, 0, 'must not call a bare, uncredentialed initializeApp()')
  assert.ok(rl.adminDbCalls >= 1, 'must use adminDb() from fcm.js')
  assert.equal(rl.logWrites[0]?.name, 'logs')
  assert.equal(rl.logWrites[0]?.doc.type, 'rate_limit_violation')
  assert.equal(rl.mails.length, 1, 'exactly one alert (cooldown suppresses the rest)')
  assert.equal(rl.mails[0].templateId, 'log_alert')
  assert.equal(rl.mails[0].data.type, 'rate_limit_violation')
})
