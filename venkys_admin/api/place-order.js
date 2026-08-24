/* eslint-env node */
// Vercel Serverless Function: Create an order document (server-owned)
// Endpoint: /api/place-order
// Method: POST
// Body (web/customer shape — see venkys/api/place-order.js for the full
// customer-facing contract, identical here): {
//   items, customer, orderType, paymentMethod, taxRate?
// }
// Body (POS/staff shape, source: 'pos'), additionally: {
//   source: 'pos', userId?: string|null, status?: 'placed'|'preparing'|...,
//   guestOrder?: boolean, guestOrderDate?: string, guestOrderAt?: string,
//   payment?: { method, status, reference, gateway, orderId } — pre-verified
//     payment info (e.g. POS already ran Razorpay + verify-payment before
//     calling this endpoint, or is recording a cash/COD sale),
// }
// Returns: { orderNo, status, totalAmount }
//
// This endpoint owns order-number generation and document creation so that:
//  - the daily counter transaction and the order-document create happen
//    atomically server-side, using server time (Asia/Kolkata), closing the
//    ID-collision and timezone-split risks of the old client-side
//    generateDailyOrderNo() + setDoc() path (AdminBiller.jsx used to
//    pre-generate the order number client-side and pass it in — it now
//    awaits this endpoint's returned orderNo instead);
//  - item pricing is always recomputed from the 'menu' collection — the
//    persisted totalAmount/subtotal are never trusted from the client;
//  - online-payment WEB orders are created as status 'pending-payment' (not
//    'placed'), so an abandoned/cancelled customer checkout is never
//    indistinguishable from a real order awaiting webhook confirmation.
//    POS orders never hit this state: the biller always completes Razorpay
//    payment + verify-payment BEFORE calling this endpoint, so a POS order
//    is only ever created already-paid or as a COD sale.
//
// Auth: customer (web) callers must be signed in, mirroring the pre-existing
// client-side requirement. POS callers must additionally hold the 'biller'
// page permission specifically (canAccess(email, 'biller')), not just "any
// staff role" — creating orders is a biller-page action.

import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyAuth } from './_lib/verifyAuth.js'
import { handleCors } from './_lib/cors.js'
import { adminDb, canAccess } from './_lib/fcm.js'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'

const rateLimiter = createRateLimiter({ routeName: 'place-order' })

const VALID_ORDER_TYPES = ['delivery', 'dine-in', 'takeaway']
const VALID_STATUSES = ['placed', 'preparing', 'ready', 'delivered', 'rejected']

function todayDateKeyIST() {
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
  const menuSnap = await db.collection('menu').get()
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
    return res.status(401).json({ error: 'Please sign in before placing an order.' })
  }

  try {
    const body = req.body || {}
    const isPosRequest = String(body.source || '').toLowerCase() === 'pos'

    // Staff (POS) extras — gated on the biller page specifically.
    if (isPosRequest) {
      const isBillerStaff = await canAccess(auth.user.email, 'biller')
      if (!isBillerStaff) {
        return res.status(403).json({ error: 'Biller access required for POS orders' })
      }
    }

    const orderType = VALID_ORDER_TYPES.includes(body.orderType)
      ? body.orderType
      : (isPosRequest ? 'dine-in' : 'delivery')
    const paymentMethod = ['cod', 'upi', 'card', 'online'].includes(body.paymentMethod)
      ? body.paymentMethod
      : (body.customer?.payment?.method || 'cod')
    const items = Array.isArray(body.items) ? body.items : []
    if (!items.length) return res.status(400).json({ error: 'Order must include at least one item' })

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

    let initialStatus = 'placed'
    if (isPosRequest && VALID_STATUSES.includes(body.status)) {
      initialStatus = body.status
    } else if (!isPosRequest && paymentMethod !== 'cod') {
      // See file header: distinct from 'placed' so an abandoned/cancelled
      // web checkout is never mistaken for a real pending order.
      initialStatus = 'pending-payment'
    }

    // POS pre-verified payment (e.g. Razorpay already captured + verified
    // before this call) is passed through as-is; otherwise a fresh
    // pending/COD payment record is created.
    const posPayment = isPosRequest && customer.payment && typeof customer.payment === 'object' ? customer.payment : null
    const payment = posPayment ? {
      method: posPayment.method || paymentMethod,
      status: posPayment.status || 'pending',
      reference: posPayment.reference || null,
      collectedBy: posPayment.collectedBy || null,
      collectedAt: posPayment.collectedAt || null,
      metadata: posPayment.metadata || null,
    } : {
      method: paymentMethod,
      status: 'pending',
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

      if (isPosRequest) {
        const normalizedPayMethod = String(payment?.method || '').toLowerCase()
        const needsManagerOtp = orderType === 'dine-in' && normalizedPayMethod === 'cod'
        if (needsManagerOtp) {
          orderDoc.cashManagerOtp = null
          orderDoc.cashManagerOtpFor = 'dine-in-cod'
          orderDoc.cashManagerOtpVerified = false
        }
        if (body.guestOrder != null) orderDoc.guestOrder = !!body.guestOrder
        if (body.guestOrderDate) orderDoc.guestOrderDate = String(body.guestOrderDate)
        if (body.guestOrderAt) orderDoc.guestOrderAt = String(body.guestOrderAt)
      }

      tx.create(orderRef, orderDoc)
      return candidateOrderNo
    })

    return res.status(200).json({ orderNo, status: initialStatus, totalAmount })
  } catch (err) {
    console.error('place-order error', err)
    return res.status(500).json({ error: 'Failed to place order' })
  }
}
