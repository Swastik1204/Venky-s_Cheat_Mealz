// Order-binding gate for the Razorpay webhook (F1, webhook path).
//
// Run:  node --test venkys/api/__tests__/razorpay-webhook-binding.test.mjs
//
// SCOPE: reproduction of the decision logic in razorpay-webhook.js — which
// internal order a webhook resolves to, and whether it marks it paid. The real
// handler fetches the Razorpay order and Firestore internally, so it can't be
// driven end-to-end without live credentials; the pre-merge gate is the live
// Razorpay TEST-mode webhook simulation described in the PR. Keep this in sync
// with razorpay-webhook.js if that logic changes.
//
// The bug being guarded against: the old handler resolved the order from
// paymentEntity.notes.firestoreOrderId, which is populated from the client's
// Razorpay Checkout options — a genuinely-signed webhook payload could name
// any pending order there and it would be flipped to paid with no owner or
// amount check.

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mirror of razorpay-webhook.js: the order id ALWAYS comes from the Razorpay
// order's server-stamped notes, never the payment's notes.
function resolveFirestoreOrderId({ rzpOrder /*, paymentEntity — intentionally unused */ }) {
  return rzpOrder?.notes?.firestoreOrderId || null;
}

// Mirror of the payment.captured amount gate.
function captureGate({ order, rzpOrder, paymentEntity }) {
  const firestoreOrderId = resolveFirestoreOrderId({ rzpOrder });
  if (!firestoreOrderId) return { action: 'skip', reason: 'unbound_razorpay_order' };
  if (!order) return { action: 'skip', reason: 'order_not_found' };

  const expectedPaise = Math.round(Number(order.totalAmount || 0) * 100);
  if (Number(rzpOrder.amount) !== expectedPaise || Number(paymentEntity.amount) !== expectedPaise) {
    return { action: 'skip', reason: 'amount_mismatch' };
  }
  if (String(order.payment?.status || '').toLowerCase() === 'paid') {
    return { action: 'skip', reason: 'already_paid' };
  }
  return { action: 'mark_paid', firestoreOrderId };
}

test('order resolves from the Razorpay order notes, not the payment notes', () => {
  const rzpOrder = { amount: 50000, notes: { firestoreOrderId: 'ORD-REAL' } };
  const paymentEntity = { amount: 50000, notes: { firestoreOrderId: 'ORD-ATTACKER' } };
  assert.equal(resolveFirestoreOrderId({ rzpOrder, paymentEntity }), 'ORD-REAL');
});

test('the F1 webhook attack: crafted payment notes naming another order are ignored', () => {
  // Attacker owns same-priced ORD-A and ORD-B, pays ORD-A. They craft/replay a
  // webhook payload for that real payment but set payment.notes.firestoreOrderId
  // = 'ORD-B'. The Razorpay order (server-stamped) still says ORD-A.
  const order = { totalAmount: 500, payment: { status: 'pending' } };
  const rzpOrder = { amount: 50000, notes: { firestoreOrderId: 'ORD-A' } };
  const paymentEntity = { amount: 50000, notes: { firestoreOrderId: 'ORD-B' } };
  const result = captureGate({ order, rzpOrder, paymentEntity });
  assert.deepEqual(result, { action: 'mark_paid', firestoreOrderId: 'ORD-A' });
  // ORD-B is never named.
});

test('unbound Razorpay order (pre-fix, no notes.firestoreOrderId): skip, do not fall back to payment notes', () => {
  const rzpOrder = { amount: 50000, notes: { checksum: 'abc' } };
  const paymentEntity = { amount: 50000, notes: { firestoreOrderId: 'ORD-X' } };
  assert.equal(resolveFirestoreOrderId({ rzpOrder, paymentEntity }), null);
  assert.deepEqual(
    captureGate({ order: { totalAmount: 500 }, rzpOrder, paymentEntity }),
    { action: 'skip', reason: 'unbound_razorpay_order' },
  );
});

test('amount mismatch: Razorpay order amount does not equal the Firestore order total', () => {
  const order = { totalAmount: 500, payment: { status: 'pending' } };
  const rzpOrder = { amount: 10000, notes: { firestoreOrderId: 'ORD-A' } };
  const paymentEntity = { amount: 10000, notes: {} };
  assert.deepEqual(captureGate({ order, rzpOrder, paymentEntity }), { action: 'skip', reason: 'amount_mismatch' });
});

test('amount mismatch: captured amount differs from the order total (partial capture)', () => {
  const order = { totalAmount: 500, payment: { status: 'pending' } };
  const rzpOrder = { amount: 50000, notes: { firestoreOrderId: 'ORD-A' } };
  const paymentEntity = { amount: 30000, notes: {} };
  assert.deepEqual(captureGate({ order, rzpOrder, paymentEntity }), { action: 'skip', reason: 'amount_mismatch' });
});

test('already paid: idempotent no-op (verify-payment.js client path or webhook redelivery)', () => {
  const order = { totalAmount: 500, payment: { status: 'paid' } };
  const rzpOrder = { amount: 50000, notes: { firestoreOrderId: 'ORD-A' } };
  const paymentEntity = { amount: 50000, notes: {} };
  assert.deepEqual(captureGate({ order, rzpOrder, paymentEntity }), { action: 'skip', reason: 'already_paid' });
});

test('happy path: bound order, matching amounts, still pending -> mark paid', () => {
  const order = { totalAmount: 500, payment: { status: 'pending' } };
  const rzpOrder = { amount: 50000, notes: { firestoreOrderId: 'ORD-A' } };
  const paymentEntity = { amount: 50000, notes: {} };
  assert.deepEqual(captureGate({ order, rzpOrder, paymentEntity }), { action: 'mark_paid', firestoreOrderId: 'ORD-A' });
});
