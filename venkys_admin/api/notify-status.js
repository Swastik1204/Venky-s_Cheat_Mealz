/* eslint-env node */
// Vercel Serverless Function: Push an order status update to the customer
// Endpoint: /api/notify-status
// Method: POST
// Body: { orderNo: string, status: string }
//
// Called by the admin POS after a status transition. Staff-only. The push
// content is derived server-side from the order document; the notification
// deep-links to /active-orders?id={orderNo} on the customer app.
// Skips silently when the customer has no registered FCM token.

import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyAuth } from './_lib/verifyAuth.js'
import { handleCors } from './_lib/cors.js'
import { adminDb, sendFCMToUser, isStaffEmail } from './_lib/fcm.js'

const rateLimiter = createRateLimiter({ routeName: 'notify-status' })

const CUSTOMER_APP_BASE = (process.env.CUSTOMER_APP_URL || 'https://venkys.vercel.app').replace(/\/$/, '')

function buildStatusMessage(status, order) {
  const orderType = String(order.orderType || '').toLowerCase()
  const orderNo = order.orderNo || ''
  switch (status) {
    case 'placed':
      return { title: 'Order confirmed ✅', body: `Order #${orderNo} has been received. We'll start preparing it shortly.` }
    case 'preparing':
      return { title: 'Cooking your order 👨‍🍳', body: `Order #${orderNo} is being prepared.` }
    case 'ready':
      if (orderType === 'delivery') {
        return { title: 'Order out for delivery 🛵', body: `Order #${orderNo} is on its way to you.` }
      }
      if (orderType === 'dine-in') {
        return { title: 'Your order is ready 🍽️', body: `Order #${orderNo} is ready to be served.` }
      }
      return { title: 'Ready for pickup 🛍️', body: `Order #${orderNo} is ready. Please collect it at the counter.` }
    case 'delivered':
      return { title: 'Order delivered 🎉', body: `Order #${orderNo} is complete. Tap to view your bill and order details.` }
    case 'rejected':
      return { title: 'Order update', body: `Order #${orderNo} could not be processed. Tap for details.` }
    default:
      return null
  }
}

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

  // Staff only — customers must not be able to trigger pushes to other users
  if (!(await isStaffEmail(auth.user?.email))) {
    return res.status(403).json({ error: 'Staff access required' })
  }

  try {
    const { orderNo, status } = req.body || {}
    if (!orderNo || typeof orderNo !== 'string') {
      return res.status(400).json({ error: 'Missing orderNo' })
    }
    const normalizedStatus = String(status || '').toLowerCase()

    const db = adminDb()
    const orderSnap = await db.collection('orders').doc(orderNo).get()
    if (!orderSnap.exists) return res.status(404).json({ error: 'Order not found' })
    const order = orderSnap.data()

    // POS/guest orders have no user account to push to
    if (!order.userId) return res.status(200).json({ ok: true, skipped: 'guest-order' })

    const msg = buildStatusMessage(normalizedStatus, order)
    if (!msg) return res.status(400).json({ error: `Unsupported status: ${normalizedStatus}` })

    const url = `${CUSTOMER_APP_BASE}/active-orders?id=${encodeURIComponent(order.orderNo || orderNo)}`
    const result = await sendFCMToUser(order.userId, {
      title: msg.title,
      body: msg.body,
      data: {
        type: 'order_status',
        orderNo: order.orderNo || orderNo,
        status: normalizedStatus,
        orderType: order.orderType || '',
        url,
      },
    })

    return res.status(200).json({ ok: true, result })
  } catch (err) {
    console.error('notify-status error', err)
    return res.status(500).json({ error: 'Failed to send status notification' })
  }
}
