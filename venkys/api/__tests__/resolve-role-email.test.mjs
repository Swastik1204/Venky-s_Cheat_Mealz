import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveRoleEmail } from '../_lib/verifyAuth.js'

test('verified email resolves, lowercased and trimmed', () => {
  assert.equal(resolveRoleEmail({ email: '  Staff@Example.com ', email_verified: true }), 'staff@example.com')
})

test('unverified password account with a staff email resolves to null', () => {
  assert.equal(resolveRoleEmail({ email: 'staff@example.com', email_verified: false, firebase: { sign_in_provider: 'password' } }), null)
})

test('missing email_verified claim is treated as unverified', () => {
  assert.equal(resolveRoleEmail({ email: 'staff@example.com' }), null)
})

test('phone-only token has no email', () => {
  assert.equal(resolveRoleEmail({ phone_number: '+919999999999', email_verified: false }), null)
  assert.equal(resolveRoleEmail(null), null)
})
