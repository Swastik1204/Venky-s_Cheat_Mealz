/* eslint-env node */
/**
 * Server-side re-verification for POS (admin_pos) online payments.
 *
 * WHY THIS EXISTS: admin/api/place-order.js's POS branch used to trust
 * `customer.payment` (method/status/reference) verbatim from the request
 * body — a caller claiming `{ status: 'paid', reference: 'anything' }`
 * would have that persisted as-is onto a brand-new order, with nothing
 * server-side ever checking that a real, correctly-sized Razorpay payment
 * actually happened. Unlike the customer web checkout (order created
 * BEFORE payment, then a webhook/verify-payment step flips it to paid),
 * the POS flow creates the order AFTER payment completes — there's no
 * pre-existing order to bind a Razorpay order to at creation time (see
 * create-order.js's header comment), so the binding has to happen here
 * instead: independently re-fetch the claimed payment from Razorpay and
 * confirm it actually captured the right amount for the right order,
 * every time, before trusting the client's word for any of it.
 *
 * fetchAndValidateRazorpayPayment is a pure function around a caller-
 * supplied Razorpay client (dependency-injected) specifically so it can be
 * unit-tested by mocking `razorpay.payments.fetch` — no live Razorpay
 * credentials or network access required to test the validation logic
 * itself. See admin/api/__tests__/posPayment.test.mjs.
 */

const DEFAULT_TOLERANCE_RUPEES = 1

/**
 * @param {object} params
 * @param {{ payments: { fetch: (id: string) => Promise<object> } }} params.razorpay
 * @param {string} params.orderId - the Razorpay order id the client claims this payment belongs to
 * @param {string} params.paymentId - the Razorpay payment id to fetch and validate
 * @param {number} params.expectedAmountRupees - the server-computed order total (never client-supplied)
 * @param {number} [params.toleranceRupees]
 * @returns {Promise<{ ok: true, amountRupees: number } | { ok: false, reason: string }>}
 */
export async function fetchAndValidateRazorpayPayment({
  razorpay,
  orderId,
  paymentId,
  expectedAmountRupees,
  toleranceRupees = DEFAULT_TOLERANCE_RUPEES,
}) {
  if (!orderId || typeof orderId !== 'string') return { ok: false, reason: 'missing_order_id' }
  if (!paymentId || typeof paymentId !== 'string') return { ok: false, reason: 'missing_payment_id' }
  if (!Number.isFinite(expectedAmountRupees) || expectedAmountRupees <= 0) {
    return { ok: false, reason: 'invalid_expected_amount' }
  }

  let payment
  try {
    payment = await razorpay.payments.fetch(paymentId)
  } catch (err) {
    return { ok: false, reason: 'payment_lookup_failed', detail: err?.message }
  }
  if (!payment) return { ok: false, reason: 'payment_not_found' }

  if (String(payment.status || '').toLowerCase() !== 'captured') {
    return { ok: false, reason: 'not_captured' }
  }
  if (String(payment.order_id || '') !== orderId) {
    // The payment is real, but not for the Razorpay order this call claims
    // it's for — exactly the swap the customer-side binding fix prevents,
    // adapted to this flow's order-after-payment shape.
    return { ok: false, reason: 'order_id_mismatch' }
  }

  const capturedPaise = Math.round(Number(payment.amount))
  const expectedPaise = Math.round(expectedAmountRupees * 100)
  const tolerancePaise = Math.round(toleranceRupees * 100)
  if (!Number.isFinite(capturedPaise) || Math.abs(capturedPaise - expectedPaise) > tolerancePaise) {
    return { ok: false, reason: 'amount_mismatch', capturedPaise, expectedPaise }
  }

  return { ok: true, amountRupees: capturedPaise / 100 }
}

/**
 * Firestore collection used to claim a Razorpay paymentId exactly once, so
 * a single real capture can never be replayed onto more than one order.
 * The claim doc is written inside the SAME transaction that creates the
 * order (see place-order.js) — read-then-write on this doc, keyed by
 * paymentId, is what makes the claim atomic with order creation.
 */
export const POS_PAYMENT_CLAIMS_COLLECTION = 'posPaymentClaims'
