/* eslint-env node */
// Vercel Serverless Function: push notifications (staff + customer)
//
// Merged notify-order.js + notify-status.js into one function — the Vercel
// Hobby plan caps a deployment at 12 serverless functions and venkys_admin
// was at that ceiling. Old paths still work unchanged: vercel.json rewrites
//   /api/notify-order  -> /api/notify?__route=order
//   /api/notify-status -> /api/notify?__route=status
// Frontend callers (src/lib/data-orders.js) were not touched.
//
//   __route=order  (POST) — notify staff of a newly placed order    Body: { orderNo }
//   __route=status (POST) — push an order status update to customer  Body: { orderNo, status }
//
// Each sub-handler is the verbatim body of its former standalone file,
// including its own per-route rate limiter, CORS/preflight, method check
// and auth — behaviour is unchanged.

import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyAuth } from './_lib/verifyAuth.js'
import { handleCors } from './_lib/cors.js'
import { adminDb, sendFCMToStaff, sendFCMToUser, isStaffEmail, FieldValue } from './_lib/fcm.js'

const orderLimiter = createRateLimiter({ routeName: 'notify-order' })
const statusLimiter = createRateLimiter({ routeName: 'notify-status' })

const CUSTOMER_APP_BASE = (process.env.CUSTOMER_APP_URL || 'https://venkys.vercel.app').replace(/\/$/, '')

// ── __route=order — staff new-order push (was notify-order.js) ──
// Called by the client AFTER the order document is persisted (COD orders
// immediately; online orders after payment verification). All push content
// is read from the order document server-side — nothing is trusted from the
// request body except the order id. A staffNotifiedAt field on the order
// deduplicates repeat calls.
async function handleOrder(req, res) {
  await orderLimiter(req, res, () => {})
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

// ── __route=status — customer status push (was notify-status.js) ──
// Called by the admin POS after a status transition. Staff-only. The push
// content is derived server-side from the order document; the notification
// deep-links to /active-orders?id={orderNo} on the customer app.
// Skips silently when the customer has no registered FCM token.
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
        return { title: 'Out for delivery 🛵', body: `Order #${orderNo} is on its way to you.` }
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

async function handleStatus(req, res) {
  await statusLimiter(req, res, () => {})
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

export default async function handler(req, res) {
  const route = req.query?.__route
  if (route === 'order') return handleOrder(req, res)
  if (route === 'status') return handleStatus(req, res)
  return res.status(404).json({ error: 'Unknown route' })
}
