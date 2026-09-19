// Cron-endpoint authentication (api/_lib/cronAuth.js).
//
// Run:  node --test api/__tests__/cron-auth.test.mjs
//
// Tests the REAL function, not a copy. Also fails if venkys_admin's copy of
// the helper drifts from this one — the two apps can't import from each other.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isValidCronAuth } from '../_lib/cronAuth.js'

const SECRET = 'a-long-random-cron-secret-for-tests-0123456789'
const req = (headers) => ({ headers })

test('exact Bearer <secret> is accepted', () => {
  assert.equal(isValidCronAuth(req({ authorization: `Bearer ${SECRET}` }), SECRET), true)
})

test('wrong secret is rejected', () => {
  assert.equal(isValidCronAuth(req({ authorization: 'Bearer nope' }), SECRET), false)
  assert.equal(isValidCronAuth(req({ authorization: `Bearer ${SECRET}x` }), SECRET), false)
  assert.equal(isValidCronAuth(req({ authorization: `Bearer ${SECRET.slice(0, -1)}` }), SECRET), false)
})

test('missing Authorization header is rejected', () => {
  assert.equal(isValidCronAuth(req({}), SECRET), false)
  assert.equal(isValidCronAuth({}, SECRET), false)
  assert.equal(isValidCronAuth(undefined, SECRET), false)
})

test('the spoofable x-vercel-cron header proves nothing', () => {
  assert.equal(isValidCronAuth(req({ 'x-vercel-cron': '1' }), SECRET), false)
  assert.equal(isValidCronAuth(req({ 'x-vercel-cron': '1', authorization: 'Bearer nope' }), SECRET), false)
})

test('a bare secret without the Bearer prefix is rejected', () => {
  assert.equal(isValidCronAuth(req({ authorization: SECRET }), SECRET), false)
})

test('a Firebase-style user token is not a cron credential', () => {
  assert.equal(isValidCronAuth(req({ authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9.e30.sig' }), SECRET), false)
})

test('fails closed when CRON_SECRET is unset or empty', () => {
  for (const s of [undefined, null, '']) {
    assert.equal(isValidCronAuth(req({ authorization: 'Bearer ' }), s), false)
    assert.equal(isValidCronAuth(req({ authorization: 'Bearer undefined' }), s), false)
    assert.equal(isValidCronAuth(req({ authorization: 'Bearer null' }), s), false)
    assert.equal(isValidCronAuth(req({ authorization: '' }), s), false)
  }
})

test('reads process.env.CRON_SECRET by default', () => {
  const prev = process.env.CRON_SECRET
  try {
    process.env.CRON_SECRET = SECRET
    assert.equal(isValidCronAuth(req({ authorization: `Bearer ${SECRET}` })), true)
    delete process.env.CRON_SECRET
    assert.equal(isValidCronAuth(req({ authorization: `Bearer ${SECRET}` })), false)
  } finally {
    if (prev === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = prev
  }
})

test('venkys and venkys_admin copies of cronAuth.js are identical', () => {
  const a = readFileSync(new URL('../_lib/cronAuth.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n')
  const b = readFileSync(new URL('../../../venkys_admin/api/_lib/cronAuth.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n')
  assert.equal(a, b)
})
