/* eslint-env node */
// Vercel Serverless Function: Notify staff of a newly placed order
// Endpoint: /api/notify-order
// Method: POST
// Body: { orderNo: string }
//
// Called by the client AFTER the order document is persisted (COD orders
// immediately; online orders after payment verification). All push content
// is read from the order document server-side — nothing is trusted from the
// request body except the order id. A staffNotifiedAt field on the order
// deduplicates repeat calls.

import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyAuth } from './_lib/verifyAuth.js'
import { handleCors } from './_lib/cors.js'
import { adminDb, sendFCMToStaff, isStaffEmail, FieldValue } from './_lib/fcm.js'

const rateLimiter = createRateLimiter({ routeName: 'notify-order' })

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

  try {
    const { orderNo } = req.body || {}
    if (!orderNo || typeof orderNo !== 'string') {
      return res.status(400).json({ error: 'Missing orderNo' })
    }

    const db = adminDb()
    const orderRef = db.collection('orders').doc(orderNo)
    const orderSnap = await orderRef.get()
    if (!orderSnap.exists) return res.status(404).json({ error: 'Order not found' })
    const order = orderSnap.data()

    // Caller must own the order or be staff
    const callerUid = auth.user?.uid || null
    const callerEmail = auth.user?.email || null
    const ownsOrder = callerUid && order.userId === callerUid
    if (!ownsOrder && !(await isStaffEmail(callerEmail))) {
      return res.status(403).json({ error: 'Not allowed to notify for this order' })
    }

    // Dedupe: only notify staff once per order
    if (order.staffNotifiedAt) {
      return res.status(200).json({ ok: true, deduped: true })
    }

    const isDineInCod = order.orderType === 'dine-in' && order.payment?.method === 'cod'
    const result = await sendFCMToStaff({
      title: order.orderType === 'dine-in' ? '🚨 New Dine-in Order' : '🛒 New Online Order',
      body: `#${order.orderNo || orderNo} • ${order.customer?.name || 'Customer'} • ₹${order.totalAmount ?? ''}`,
      data: {
        type: 'new_order',
        orderNo: order.orderNo || orderNo,
        orderType: order.orderType || 'online',
        customerName: order.customer?.name || 'Customer',
        total: order.totalAmount ?? 0,
        isDineInCod,
      },
    })

    await orderRef.set({ staffNotifiedAt: FieldValue.serverTimestamp() }, { merge: true })

    return res.status(200).json({ ok: true, result })
  } catch (err) {
    console.error('notify-order error', err)
    return res.status(500).json({ error: 'Failed to notify staff' })
  }
}
