/* eslint-env node */
// Vercel Serverless Function: Razorpay Webhook
// Endpoint: /api/razorpay-webhook
// Method: POST

import crypto from 'crypto'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin (singleton)
if (!getApps().length) {
  const sa = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim()
  if (sa) {
    try { initializeApp({ credential: cert(JSON.parse(sa)) }) } catch { initializeApp() }
  } else {
    initializeApp()
  }
}

async function readRawBody(req) {
  if (typeof req.body === 'string') return req.body
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8')

  // Fallback for environments that parsed JSON before this handler.
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
    const firestoreOrderId = paymentEntity?.notes?.firestoreOrderId

    if (firestoreOrderId) {
      const db = getFirestore()
      if (event === 'payment.captured') {
        await db.collection('orders').doc(String(firestoreOrderId)).set({
          payment: {
            status: 'paid',
            razorpayPaymentId: paymentEntity.id || null,
            capturedAt: new Date().toISOString(),
          },
        }, { merge: true })
      } else if (event === 'payment.failed') {
        await db.collection('orders').doc(String(firestoreOrderId)).set({
          payment: {
            status: 'failed',
          },
        }, { merge: true })
      }
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('razorpay-webhook error', err)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}
