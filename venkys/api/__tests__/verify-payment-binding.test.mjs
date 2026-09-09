// Razorpay order-binding gate — regression coverage for the F1 fix.
//
// Run:  node --test venkys/api/__tests__/verify-payment-binding.test.mjs
//
// SCOPE: this is a faithful reproduction of the two gates inside
// verify-payment.js -> recordPaidStatus() (the amount check and the
// notes.firestoreOrderId binding check). It is NOT a full integration test —
// recordPaidStatus() news up getFirestore() and the Razorpay client
// internally, so it can't be driven end-to-end without live credentials.
//
// The real pre-merge gate is the live Razorpay TEST-mode run described in the
// PR: create two same-priced pending orders, pay one, replay its
// paymentId/signature against the other's orderNo, confirm rejection with
// reason 'order_binding_mismatch'. This file guards the predicate itself
// against silent regression; the live run proves the wiring.
//
// Keep this in sync with verify-payment.js if that gate ever changes.

import { test } from 'node:test';
import assert from 'node:assert/strict';

// --- reproduction of verify-payment.js recordPaidStatus()'s cross-check block
//     (the try{} around the Razorpay orders.fetch). Mirror of lines ~59-83. ---
function crossCheck({ order, orderNo, rzpOrder }) {
  const expectedPaise = Math.round(Number(order.totalAmount || 0) * 100);
  if (Number(rzpOrder?.amount) !== expectedPaise) {
    return { recorded: false, reason: 'amount_mismatch' };
  }
  if (String(rzpOrder?.notes?.firestoreOrderId || '') !== String(orderNo)) {
    return { recorded: false, reason: 'order_binding_mismatch' };
  }
  return { recorded: true };
}

test('happy path: Razorpay order bound to the same orderNo, matching amount -> recorded', () => {
  const order = { totalAmount: 500 };
  const rzpOrder = { amount: 50000, notes: { firestoreOrderId: 'ORD-A' } };
  assert.deepEqual(crossCheck({ order, orderNo: 'ORD-A', rzpOrder }), { recorded: true });
});

test('the F1 attack: pay order A, replay its payment against same-priced order B -> order_binding_mismatch', () => {
  // Attacker has two own pending orders, both Rs.500. They pay A for real, then
  // call verify-payment with { orderId: <razorpay A>, paymentId, signature,
  // orderNo: 'ORD-B' }. Signature is valid (covers razorpayOrderId|paymentId),
  // amount matches (both Rs.500). Only the binding check stops B being marked paid.
  const orderB = { totalAmount: 500 };
  const rzpOrderA = { amount: 50000, notes: { firestoreOrderId: 'ORD-A' } };
  const result = crossCheck({ order: orderB, orderNo: 'ORD-B', rzpOrder: rzpOrderA });
  assert.deepEqual(result, { recorded: false, reason: 'order_binding_mismatch' });
});

test('pre-fix Razorpay order (notes has only checksum, no firestoreOrderId) -> order_binding_mismatch', () => {
  // Any order created before this fix shipped carries notes: { checksum } only.
  // Those must fail the binding check rather than fall through as "bound".
  const order = { totalAmount: 500 };
  const rzpOrder = { amount: 50000, notes: { checksum: 'abc123' } };
  assert.deepEqual(crossCheck({ order, orderNo: 'ORD-A', rzpOrder }), {
    recorded: false,
    reason: 'order_binding_mismatch',
  });
});

test('amount check still fires first: bound order but wrong amount -> amount_mismatch', () => {
  const order = { totalAmount: 500 };
  const rzpOrder = { amount: 10000, notes: { firestoreOrderId: 'ORD-A' } };
  assert.deepEqual(crossCheck({ order, orderNo: 'ORD-A', rzpOrder }), {
    recorded: false,
    reason: 'amount_mismatch',
  });
});

test('numeric vs string orderNo coercion: 12345 (number) matches "12345" (string note)', () => {
  const order = { totalAmount: 100 };
  const rzpOrder = { amount: 10000, notes: { firestoreOrderId: '12345' } };
  assert.deepEqual(crossCheck({ order, orderNo: 12345, rzpOrder }), { recorded: true });
});
