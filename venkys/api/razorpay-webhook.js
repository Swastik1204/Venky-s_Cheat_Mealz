/* eslint-env node */
// Vercel Serverless Function: Razorpay Webhook
// Endpoint: /api/razorpay-webhook
// Method: POST

import crypto from 'crypto'
import { adminDb, sendFCMToStaff, FieldValue } from './lib/fcm.js'

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
    const firestoreOrderId = paymentEntity?.notes?.firestoreOrderId || paymentEntity?.notes?.orderNo || paymentEntity?.notes?.orderId

    if (firestoreOrderId) {
      const db = adminDb()
      const orderRef = db.collection('orders').doc(String(firestoreOrderId))
      const orderSnap = await orderRef.get()

      if (!orderSnap.exists) {
        return res.status(200).json({ received: true, status: 'order_not_found' })
      }

      const order = orderSnap.data() || {}

      if (event === 'payment.captured') {
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
      } else if (event === 'payment.failed') {
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
      }
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('razorpay-webhook error', err)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}
