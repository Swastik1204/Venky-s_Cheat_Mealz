/* eslint-env node */
// Vercel Serverless Function: Create an order document (server-owned)
// Endpoint: /api/place-order
// Method: POST
// Body: {
//   items: [{ id?, name, rate, qty, variantLabel?, mrp?, discountPercent?, note?, modifiers? }],
//   customer: { name, phone, email?, address?, instructions?, landmark? },
//   orderType: 'delivery' | 'dine-in' | 'takeaway',
//   paymentMethod: 'cod' | 'upi' | 'card',
//   taxRate?: number,
// }
// Returns: { orderNo, status, totalAmount }
//
// This endpoint owns order-number generation and document creation so that:
//  - the daily counter transaction and the order-document create happen
//    atomically server-side, using server time (Asia/Kolkata), closing the
//    ID-collision and timezone-split risks of the old client-side
//    generateDailyOrderNo() + setDoc() path;
//  - item pricing is always recomputed from the 'menu' collection — the
//    persisted totalAmount/subtotal are never trusted from the client;
//  - online-payment orders are created as status 'pending-payment' (not
//    'placed'), so an abandoned/cancelled checkout is never indistinguishable
//    from a real order awaiting webhook confirmation, and never shows up in
//    staff "placed" queues. verify-payment.js and the Razorpay webhook both
//    flip pending-payment -> placed once payment is confirmed.
//
// Auth: customers must be signed in (mirrors the pre-existing client-side
// "Please sign in before placing an order" requirement in data-orders.js —
// this endpoint does not change that behavior, it enforces it server-side).
// Staff (POS) may pass additional fields; gated by canAccess(email, 'biller')
// specifically, not just "is any staff role" — POS order creation is a
// biller-page action.

import { createRateLimiter } from './lib/rateLimiter.js'
import { verifyAuth } from './lib/verifyAuth.js'
import { handleCors } from './lib/cors.js'
import { adminDb, canAccess } from './lib/fcm.js'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'

const rateLimiter = createRateLimiter({ routeName: 'place-order' })

const VALID_ORDER_TYPES = ['delivery', 'dine-in', 'takeaway']
const VALID_STATUSES = ['placed', 'preparing', 'ready', 'delivered', 'rejected']

function todayDateKeyIST() {
  // Server time in Asia/Kolkata (IST, UTC+5:30, no DST) — avoids the
  // timezone split that occurred when each client device computed its own
  // local date for the daily order-number counter.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const y = parts.find(p => p.type === 'year').value
  const m = parts.find(p => p.type === 'month').value
  const d = parts.find(p => p.type === 'day').value
  return `${y}${m}${d}`
}

async function verifyCartAmount(db, items) {
  const safeItems = Array.isArray(items) ? items : []
  const db2 = db
  const menuSnap = await db2.collection('menu').get()
  const priceLookup = new Map()
  menuSnap.docs.forEach(catDoc => {
    const data = catDoc.data()
    const catItems = Array.isArray(data.items) ? data.items : []
    catItems.forEach(item => {
      const name = String(item.name || '').trim().toLowerCase()
      if (!name) return
      const rate = Number(item.rate ?? item.price ?? 0)
      priceLookup.set(name, rate)
      if (Array.isArray(item.variants)) {
        item.variants.forEach(v => {
          const vLabel = String(v.label || v.name || '').trim().toLowerCase()
          if (vLabel) priceLookup.set(`${name}::${vLabel}`, Number(v.rate ?? v.price ?? rate))
        })
      }
    })
  })

  const normalizedItems = safeItems.map((item, idx) => {
    const name = String(item?.name || `Item ${idx + 1}`).trim()
    const nameKey = name.toLowerCase()
    const qty = Math.max(1, Number(item?.qty) || 1)
    const variantLabel = String(item?.variantLabel || '').trim()
    const variantKey = variantLabel.toLowerCase()
    let serverRate = variantKey ? priceLookup.get(`${nameKey}::${variantKey}`) : undefined
    if (serverRate === undefined) serverRate = priceLookup.get(nameKey)
    if (serverRate === undefined) serverRate = Number(item?.rate || 0) // add-on/custom item not in menu
    const total = Math.round(serverRate * qty)
    const normalized = { id: item?.id || `item-${idx + 1}`, name, rate: serverRate, qty, total }
    if (item?.mrp != null) normalized.mrp = Number(item.mrp) || null
    if (item?.discountPercent != null) normalized.discountPercent = Number(item.discountPercent) || null
    if (variantLabel) normalized.variantLabel = variantLabel
    if (item?.note) normalized.note = String(item.note)
    if (item?.modifiers) normalized.modifiers = item.modifiers
    return normalized
  })

  const subtotal = Math.round(normalizedItems.reduce((sum, it) => sum + it.total, 0))
  return { normalizedItems, subtotal }
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
  if (!auth.user?.uid) {
    // Mirrors the existing client-side requirement: web orders require sign-in.
    return res.status(401).json({ error: 'Please sign in before placing an order.' })
  }

  try {
    const body = req.body || {}
    const orderType = VALID_ORDER_TYPES.includes(body.orderType) ? body.orderType : 'delivery'
    const paymentMethod = ['cod', 'upi', 'card'].includes(body.paymentMethod) ? body.paymentMethod : 'cod'
    const items = Array.isArray(body.items) ? body.items : []
    if (!items.length) return res.status(400).json({ error: 'Order must include at least one item' })

    // Staff (POS) extras — gated on the biller page specifically, not just
    // "any staff role", since creating orders is a biller-page action.
    const isBillerStaff = await canAccess(auth.user.email, 'biller')
    const isPosRequest = String(body.source || '').toLowerCase() === 'pos'
    if (isPosRequest && !isBillerStaff) {
      return res.status(403).json({ error: 'Biller access required for POS orders' })
    }

    const db = adminDb()
    const { normalizedItems, subtotal } = await verifyCartAmount(db, items)

    const taxRate = typeof body.taxRate === 'number' ? body.taxRate : null
    const taxAmount = taxRate != null ? Math.round(subtotal * taxRate) : null
    const totalAmount = Math.round(subtotal + (taxAmount || 0))

    const MAX_ORDER_AMOUNT = 50000
    if (totalAmount > MAX_ORDER_AMOUNT) {
      return res.status(400).json({ error: 'Amount exceeds maximum order limit', maxAmount: MAX_ORDER_AMOUNT })
    }

    const customer = body.customer && typeof body.customer === 'object' ? body.customer : {}
    const customerPayload = {
      name: customer.name ? String(customer.name).trim() : '',
      phone: customer.phone ? String(customer.phone).trim() : '',
      address: customer.address || '',
      instructions: customer.instructions || '',
      landmark: customer.landmark || '',
      servedBy: isPosRequest ? (customer.servedBy || '') : '',
      table: customer.table || '',
    }
    if (customer.email) customerPayload.email = String(customer.email).trim()
    if (customer.geoHash) customerPayload.geoHash = customer.geoHash
    if (customer.location) customerPayload.location = customer.location

    // POS callers may pre-set status (e.g. 'preparing' for an already-accepted
    // walk-in order); web/online orders always start from the flow below.
    let initialStatus = isPosRequest && VALID_STATUSES.includes(body.status) ? body.status : 'placed'
    const isOnlinePayment = paymentMethod !== 'cod'
    if (!isPosRequest && isOnlinePayment) {
      // Distinct from 'placed' so an abandoned/cancelled checkout is never
      // mistaken for (or shown alongside) a real pending order. Flipped to
      // 'placed' by verify-payment.js or the Razorpay webhook once paid.
      initialStatus = 'pending-payment'
    }

    const payment = {
      method: paymentMethod,
      status: isPosRequest && customer.payment?.status ? customer.payment.status : 'pending',
      reference: null,
      collectedBy: null,
      collectedAt: null,
      metadata: null,
    }

    const nowTs = Timestamp.now()
    const statusActor = isPosRequest ? 'pos' : `user:${auth.user.uid}`
    const dateKey = todayDateKeyIST()
    const counterRef = db.collection('miscellaneous').doc('dailyCounter')

    const orderNo = await db.runTransaction(async (tx) => {
      const counterSnap = await tx.get(counterRef)
      const counterData = counterSnap.exists ? counterSnap.data() : {}
      const currentTotal = counterData.currentDate === dateKey ? (Number(counterData.total) || 0) : 0
      const nextSeq = currentTotal + 1
      const candidateOrderNo = `${dateKey}-${String(nextSeq).padStart(4, '0')}`
      const orderRef = db.collection('orders').doc(candidateOrderNo)
      const existing = await tx.get(orderRef)
      if (existing.exists) {
        // Should not happen (the counter is the only writer of this ID
        // shape), but never silently overwrite an existing order.
        throw new Error(`Order number collision on ${candidateOrderNo}`)
      }

      tx.set(counterRef, {
        currentDate: dateKey,
        total: nextSeq,
        lastOrderType: orderType,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })

      const orderDoc = {
        userId: isPosRequest ? (body.userId || null) : auth.user.uid,
        customer: customerPayload,
        items: normalizedItems,
        subtotal,
        orderType,
        source: isPosRequest ? 'pos' : 'web',
        orderNo: candidateOrderNo,
        status: initialStatus,
        statusHistory: [{ status: initialStatus, at: nowTs, actor: statusActor }],
        payment,
        totalAmount,
        revisionCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }
      if (taxRate != null) orderDoc.taxRate = taxRate
      if (taxAmount != null) orderDoc.taxAmount = taxAmount

      tx.create(orderRef, orderDoc)
      return candidateOrderNo
    })

    return res.status(200).json({ orderNo, status: initialStatus, totalAmount })
  } catch (err) {
    console.error('place-order error', err)
    return res.status(500).json({ error: 'Failed to place order' })
  }
}
