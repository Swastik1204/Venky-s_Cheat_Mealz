/* eslint-env node */
// Vercel Serverless Function: Razorpay Webhook
// Endpoint: /api/razorpay-webhook
// Method: POST
//
// SECURITY (F1, webhook path): the internal order this payment applies to is
// resolved ONLY from the Razorpay ORDER's server-stamped notes.firestoreOrderId
// (written by /api/create-order after it verified the order exists, is
// caller-owned, unpaid and correctly priced). It is NEVER read from
// paymentEntity.notes — that field is populated from the client's Razorpay
// Checkout options and any caller can set it. Before this, a crafted (but
// genuinely Razorpay-signed) webhook payload could name someone else's
// pending order in the payment notes and this handler would flip it to paid
// with no owner or amount check — the same class of bug as the verify-payment
// F1 fix, through a different endpoint.

import crypto from 'crypto'
import Razorpay from 'razorpay'
import { adminDb, sendFCMToStaff, FieldValue } from './_lib/fcm.js'

// Lazy so a deployment without Razorpay env vars fails inside the handler with
// a real response instead of crashing at cold start.
let _razorpay = null
function getRazorpay() {
  if (_razorpay) return _razorpay
  _razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
  return _razorpay
}

async function readRawBody(req) {
  if (typeof req.body === 'string') return req.body
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8')

  if (req.body && typeof req.body === 'object') {
    return JSON.stringify(req.body)
  }

  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

function isValidSignature(rawBody, providedSignature, secret) {
  if (!providedSignature || !secret) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  const providedBuffer = Buffer.from(String(providedSignature), 'utf8')
  if (expectedBuffer.length !== providedBuffer.length) return false
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const rawBody = await readRawBody(req)
    const providedSignature = req.headers?.['x-razorpay-signature']
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!isValidSignature(rawBody, providedSignature, secret)) {
      return res.status(400).json({ error: 'Invalid webhook signature' })
    }

    let body
    try {
      body = JSON.parse(rawBody)
    } catch {
      return res.status(400).json({ error: 'Invalid JSON payload' })
    }

    const event = body?.event
    const paymentEntity = body?.payload?.payment?.entity || {}

    // Only these two events carry a Razorpay order we can bind to an internal
    // order. Everything else is acknowledged and ignored.
    if (event !== 'payment.captured' && event !== 'payment.failed') {
      return res.status(200).json({ received: true, ignored: event || null })
    }

    const razorpayOrderId = paymentEntity?.order_id
    if (!razorpayOrderId) {
      return res.status(200).json({ received: true, status: 'no_razorpay_order_id' })
    }

    // Resolve the internal order from the Razorpay ORDER's own notes, set
    // server-side by create-order.js — never from paymentEntity.notes.
    let rzpOrder
    try {
      rzpOrder = await getRazorpay().orders.fetch(razorpayOrderId)
    } catch (err) {
      // Can't verify the binding right now. Do NOT fall back to the client's
      // payment notes. Return 5xx so Razorpay retries (captured/failed
      // webhooks are retried with backoff for ~24h) — a transient Razorpay
      // API blip clears well inside that window, and verify-payment.js's
      // client path is the other half of this belt-and-suspenders.
      console.error('[razorpay-webhook] Razorpay order fetch failed; asking Razorpay to retry:', err?.message)
      return res.status(503).json({ error: 'Order binding not verifiable yet; retry' })
    }

    const firestoreOrderId = rzpOrder?.notes?.firestoreOrderId
    if (!firestoreOrderId) {
      // A Razorpay order created before create-order.js stamped this note has
      // no server-side binding. Refuse rather than guess from client data.
      console.warn('[razorpay-webhook] Razorpay order has no server-stamped firestoreOrderId; skipping writeback', { razorpayOrderId })
      return res.status(200).json({ received: true, status: 'unbound_razorpay_order' })
    }

    const db = adminDb()
    const orderRef = db.collection('orders').doc(String(firestoreOrderId))
    const orderSnap = await orderRef.get()
    if (!orderSnap.exists) {
      return res.status(200).json({ received: true, status: 'order_not_found' })
    }
    const order = orderSnap.data() || {}

    if (event === 'payment.captured') {
      // The Razorpay order amount (server-set from the verified cart total in
      // create-order.js) AND the amount actually captured must both equal the
      // Firestore order's persisted total.
      const expectedPaise = Math.round(Number(order.totalAmount || 0) * 100)
      if (Number(rzpOrder.amount) !== expectedPaise || Number(paymentEntity.amount) !== expectedPaise) {
        console.error('[razorpay-webhook] Amount mismatch; not marking paid', {
          firestoreOrderId,
          rzpOrderAmount: rzpOrder.amount,
          capturedAmount: paymentEntity.amount,
          expectedPaise,
        })
        return res.status(200).json({ received: true, status: 'amount_mismatch' })
      }

      // Idempotent with verify-payment.js's client path and with webhook redelivery.
      if (String(order.payment?.status || '').toLowerCase() === 'paid') {
        return res.status(200).json({ received: true, status: 'already_paid' })
      }

      const patch = {
        payment: {
          ...(order.payment || {}),
          status: 'paid',
          razorpayPaymentId: paymentEntity.id || null,
          razorpayOrderId: paymentEntity.order_id || null,
          capturedAt: new Date().toISOString(),
          metadata: {
            ...(order.payment?.metadata || {}),
            verifiedBy: order.payment?.metadata?.verifiedBy || 'webhook',
            method: paymentEntity.method || order.payment?.method || null,
          },
        },
        updatedAt: FieldValue.serverTimestamp(),
      }

      if (order.status === 'pending-payment') {
        patch.status = 'placed'
        const existingHistory = Array.isArray(order.statusHistory) ? order.statusHistory : []
        patch.statusHistory = [
          ...existingHistory,
          { status: 'placed', at: new Date(), actor: 'webhook:razorpay' },
        ]
      }

      if (!order.staffNotifiedAt) {
        const isDineInCod = order.orderType === 'dine-in' && order.payment?.method === 'cod'
        const orderNo = order.orderNo || firestoreOrderId
        try {
          await sendFCMToStaff({
            title: order.orderType === 'dine-in' ? '🚨 New Dine-in Order' : '🛒 New Online Order',
            body: `#${orderNo} • ${order.customer?.name || 'Customer'} • ₹${order.totalAmount ?? ''}`,
            data: {
              type: 'new_order',
              orderNo: String(orderNo),
              orderType: order.orderType || 'online',
              customerName: order.customer?.name || 'Customer',
              total: order.totalAmount ?? 0,
              isDineInCod,
            },
          })
          patch.staffNotifiedAt = FieldValue.serverTimestamp()
        } catch (fcmErr) {
          console.error('[razorpay-webhook] Staff FCM notification error:', fcmErr?.message || fcmErr)
        }
      }

      await orderRef.set(patch, { merge: true })
      return res.status(200).json({ received: true, status: 'marked_paid' })
    }

    // event === 'payment.failed'
    if (order.payment?.status !== 'paid') {
      await orderRef.set({
        payment: {
          ...(order.payment || {}),
          status: 'failed',
          failedAt: new Date().toISOString(),
          errorDescription: paymentEntity.error_description || null,
        },
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
    }
    return res.status(200).json({ received: true, status: 'marked_failed' })
  } catch (err) {
    console.error('razorpay-webhook error', err)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}
