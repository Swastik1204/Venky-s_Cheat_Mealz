/* eslint-env node */
// Vercel Serverless Function: Verify Razorpay Payment Signature
// Endpoint: /api/verify-payment
// Method: POST
// Body: { orderId, paymentId, signature, localOrderId }
// Returns: { valid: boolean }
// Optionally updates Firestore order status to 'paid'.

import crypto from 'crypto'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, doc, updateDoc } from 'firebase/firestore'

// Lazy Firebase app init (client config can be reused here safely – secret not required for Firestore writes if security rules allow only privileged service accounts).
// For secure server admin access you'd normally use Admin SDK, but on Vercel you would need a service account key (avoid embedding large key directly).
// For now we attempt standard web SDK writes; ensure Firestore rules restrict these operations to privileged auth or rework using a dedicated backend with Admin SDK.

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
}

function getDb() {
  if (!getApps().length) {
    initializeApp(firebaseConfig)
  }
  return getFirestore()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { orderId, paymentId, signature, localOrderId } = req.body || {}
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing fields' })
    }
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex')
    const valid = expected === signature
    if (!valid) {
      return res.status(400).json({ valid: false, error: 'Invalid signature' })
    }

    if (localOrderId) {
      try {
        const db = getDb()
        const ref = doc(db, 'orders', localOrderId)
        await updateDoc(ref, { status: 'paid', payment: { method: 'online', gateway: 'razorpay', paymentId, orderId, verifiedAt: Date.now() } })
      } catch (fireErr) {
        console.warn('Firestore update failed (non-fatal):', fireErr)
      }
    }

    return res.status(200).json({ valid: true })
  } catch (e) {
    console.error('verify-payment error', e)
    return res.status(500).json({ error: 'Verification failed' })
  }
}
