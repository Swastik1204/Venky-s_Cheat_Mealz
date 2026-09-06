// Unit tests for admin/api/_lib/posPayment.js's fetchAndValidateRazorpayPayment.
//
// Pure function, no live credentials needed — the Razorpay client is a
// mock. Run with: node admin/scripts/test-pos-payment-binding.mjs
//
// A real E2E run against Razorpay's actual test-mode API is still owed
// once razorpayEnabled is flipped on for a real client (see
// RESTAURANT_CONFIG.payments.razorpayEnabled) — this only proves the
// validation logic itself makes the right call for each input shape.

import assert from 'node:assert/strict'
import { fetchAndValidateRazorpayPayment } from '../api/_lib/posPayment.js'

const tests = []
function test(name, fn) { tests.push({ name, fn }) }

function mockRazorpay(paymentOrThrow) {
  return {
    payments: {
      fetch: async (id) => {
        if (typeof paymentOrThrow === 'function') return paymentOrThrow(id)
        return paymentOrThrow
      },
    },
  }
}

test('accepts a captured payment matching order id and amount exactly', async () => {
  const razorpay = mockRazorpay({ status: 'captured', order_id: 'order_A', amount: 20000 })
  const r = await fetchAndValidateRazorpayPayment({
    razorpay, orderId: 'order_A', paymentId: 'pay_1', expectedAmountRupees: 200,
  })
  assert.equal(r.ok, true)
  assert.equal(r.amountRupees, 200)
})

test('accepts amount within tolerance (rounding)', async () => {
  const razorpay = mockRazorpay({ status: 'captured', order_id: 'order_A', amount: 20050 }) // ₹200.50 vs expected ₹200
  const r = await fetchAndValidateRazorpayPayment({
    razorpay, orderId: 'order_A', paymentId: 'pay_1', expectedAmountRupees: 200, toleranceRupees: 1,
  })
  assert.equal(r.ok, true)
})

test('rejects amount outside tolerance — the core exploit this closes', async () => {
  // Attacker pays ₹1 for a small Razorpay order, then claims it covers a ₹5000 cart.
  const razorpay = mockRazorpay({ status: 'captured', order_id: 'order_A', amount: 100 }) // ₹1 captured
  const r = await fetchAndValidateRazorpayPayment({
    razorpay, orderId: 'order_A', paymentId: 'pay_1', expectedAmountRupees: 5000,
  })
  assert.equal(r.ok, false)
  assert.equal(r.reason, 'amount_mismatch')
})

test('rejects a payment that belongs to a different Razorpay order', async () => {
  // A genuine captured payment for order_B is claimed against order_A.
  const razorpay = mockRazorpay({ status: 'captured', order_id: 'order_B', amount: 20000 })
  const r = await fetchAndValidateRazorpayPayment({
    razorpay, orderId: 'order_A', paymentId: 'pay_1', expectedAmountRupees: 200,
  })
  assert.equal(r.ok, false)
  assert.equal(r.reason, 'order_id_mismatch')
})

test('rejects a payment that has not actually captured', async () => {
  for (const status of ['authorized', 'failed', 'refunded', 'created']) {
    const razorpay = mockRazorpay({ status, order_id: 'order_A', amount: 20000 })
    const r = await fetchAndValidateRazorpayPayment({
      razorpay, orderId: 'order_A', paymentId: 'pay_1', expectedAmountRupees: 200,
    })
    assert.equal(r.ok, false, `status=${status} should be rejected`)
    assert.equal(r.reason, 'not_captured')
  }
})

test('rejects when the payment lookup itself fails (network/4xx from Razorpay)', async () => {
  const razorpay = mockRazorpay(() => { throw new Error('Razorpay API error: not found') })
  const r = await fetchAndValidateRazorpayPayment({
    razorpay, orderId: 'order_A', paymentId: 'pay_missing', expectedAmountRupees: 200,
  })
  assert.equal(r.ok, false)
  assert.equal(r.reason, 'payment_lookup_failed')
})

test('rejects when the lookup returns nothing', async () => {
  const razorpay = mockRazorpay(null)
  const r = await fetchAndValidateRazorpayPayment({
    razorpay, orderId: 'order_A', paymentId: 'pay_1', expectedAmountRupees: 200,
  })
  assert.equal(r.ok, false)
  assert.equal(r.reason, 'payment_not_found')
})

test('rejects missing orderId / paymentId / expectedAmount before ever calling Razorpay', async () => {
  let called = false
  const razorpay = mockRazorpay(() => { called = true; return { status: 'captured', order_id: 'x', amount: 100 } })

  const r1 = await fetchAndValidateRazorpayPayment({ razorpay, orderId: '', paymentId: 'pay_1', expectedAmountRupees: 200 })
  assert.equal(r1.ok, false); assert.equal(r1.reason, 'missing_order_id')

  const r2 = await fetchAndValidateRazorpayPayment({ razorpay, orderId: 'order_A', paymentId: '', expectedAmountRupees: 200 })
  assert.equal(r2.ok, false); assert.equal(r2.reason, 'missing_payment_id')

  const r3 = await fetchAndValidateRazorpayPayment({ razorpay, orderId: 'order_A', paymentId: 'pay_1', expectedAmountRupees: 0 })
  assert.equal(r3.ok, false); assert.equal(r3.reason, 'invalid_expected_amount')

  const r4 = await fetchAndValidateRazorpayPayment({ razorpay, orderId: 'order_A', paymentId: 'pay_1', expectedAmountRupees: -5 })
  assert.equal(r4.ok, false); assert.equal(r4.reason, 'invalid_expected_amount')

  assert.equal(called, false, 'must not call Razorpay when inputs are already invalid')
})

test('replay shape: the SAME real captured payment validated twice both succeed at this layer', async () => {
  // fetchAndValidateRazorpayPayment only checks "is this a genuine, correctly-
  // sized capture" — it has no memory of prior calls by design. Replay
  // prevention (a paymentId can only ever back ONE order) is the Firestore
  // posPaymentClaims transaction in place-order.js, not this function. This
  // test documents that boundary so it isn't mistaken for a gap here.
  const razorpay = mockRazorpay({ status: 'captured', order_id: 'order_A', amount: 20000 })
  const first = await fetchAndValidateRazorpayPayment({ razorpay, orderId: 'order_A', paymentId: 'pay_1', expectedAmountRupees: 200 })
  const second = await fetchAndValidateRazorpayPayment({ razorpay, orderId: 'order_A', paymentId: 'pay_1', expectedAmountRupees: 200 })
  assert.equal(first.ok, true)
  assert.equal(second.ok, true)
})

let failed = 0
for (const { name, fn } of tests) {
  try {
    await fn()
    console.log(`  ok    ${name}`)
  } catch (err) {
    failed++
    console.log(`  FAIL  ${name}`)
    console.log(`        ${err.message}`)
  }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`)
if (failed) process.exit(1)
