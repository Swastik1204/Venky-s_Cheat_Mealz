/* eslint-env node */
// Vercel Serverless Function: Re-check a stuck online payment against Razorpay
// Endpoint: /api/recheck-payment
// Method: POST
// Body: { orderNo: string }
// Returns: { status: 'paid' | 'unpaid' | 'no_payment_found' | 'cod' | 'already_paid', updated: boolean }
//
// Staff-only. For orders stuck at payment.status='initiated' (customer paid but
// neither the client writeback nor the webhook recorded it). Scans recent
// Razorpay payments for notes.firestoreOrderId === orderNo and reconciles the
// Firestore order document accordingly.

import Razorpay from 'razorpay'
import { createRateLimiter } from './lib/rateLimiter.js'
import { verifyAuth } from './lib/verifyAuth.js'
import { handleCors } from './lib/cors.js'
import { adminDb, isStaffEmail } from './lib/fcm.js'

const rateLimiter = createRateLimiter({ routeName: 'recheck-payment' })

export default async function handler(req, res) {
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return

  if (handleCors(req, res, 'POST, OPTIONS')) return
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = await verifyAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })
  if (!(await isStaffEmail(auth.user?.email))) {
    return res.status(403).json({ error: 'Staff access required' })
  }

  if (!(process.env.RAZORPAY_KEY_SECRET || '').trim()) {
    return res.status(500).json({ error: 'Server misconfigured: RAZORPAY_KEY_SECRET not set' })
  }

  try {
    const { orderNo } = req.body || {}
    if (!orderNo || typeof orderNo !== 'string') {
      return res.status(400).json({ error: 'Missing orderNo' })
    }

    const db = adminDb()
    const ref = db.collection('orders').doc(orderNo)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ error: 'Order not found' })
    const order = snap.data() || {}

    if (String(order.payment?.method || '').toLowerCase() === 'cod') {
      return res.status(200).json({ status: 'cod', updated: false })
    }
    if (String(order.payment?.status || '').toLowerCase() === 'paid') {
      return res.status(200).json({ status: 'already_paid', updated: false })
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    // Scan payments around the order's creation time for our orderNo in notes.
    // Checkout attaches notes.firestoreOrderId to every Razorpay payment.
    const createdAtSec = order.createdAt?.seconds || Math.floor(Date.now() / 1000) - 24 * 3600
    const payments = await razorpay.payments.all({
      from: createdAtSec - 300,
      to: Math.min(Math.floor(Date.now() / 1000), createdAtSec + 24 * 3600),
      count: 100,
    })

    const matches = (payments?.items || []).filter(p => p?.notes?.firestoreOrderId === orderNo)
    const captured = matches.find(p => p.status === 'captured')

    if (captured) {
      const expectedPaise = Math.round(Number(order.totalAmount || 0) * 100)
      if (Number(captured.amount) !== expectedPaise) {
        // Paid, but not the amount we expected — surface for human judgement, don't auto-mark.
        return res.status(200).json({
          status: 'amount_mismatch',
          updated: false,
          paidAmount: Number(captured.amount) / 100,
          expectedAmount: Number(order.totalAmount || 0),
          paymentId: captured.id,
        })
      }
      await ref.set({
        payment: {
          status: 'paid',
          reference: captured.id,
          razorpayOrderId: captured.order_id || null,
          verifiedAt: new Date().toISOString(),
          metadata: { verifiedBy: 'staff-recheck', recheckedBy: auth.user?.email || null },
        },
        updatedAt: new Date(),
      }, { merge: true })
      return res.status(200).json({ status: 'paid', updated: true, paymentId: captured.id })
    }

    if (matches.length > 0) {
      // Attempts exist but none captured — genuinely unpaid.
      return res.status(200).json({ status: 'unpaid', updated: false, attempts: matches.length })
    }

    return res.status(200).json({ status: 'no_payment_found', updated: false })
  } catch (err) {
    console.error('recheck-payment error', err)
    return res.status(500).json({ error: 'Failed to re-check payment' })
  }
}
