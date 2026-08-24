// Order-related data functions (admin)
// Canonical order document schema (aligned to customer data-orders.js writes):
// {
//   userId: string | null,
//   customer: map,
//   items: list,
//   subtotal: number,
//   orderType: string,
//   source: string,
//   orderNo: string,
//   status: string,
//   statusHistory: list,
//   payment: map,
//   totalAmount: number,
//   revisionCount: number,
//   createdAt: timestamp,
//   updatedAt: timestamp,
//   taxRate?: number,
//   taxAmount?: number,
//   // admin extensions may exist (guestOrder, cashManagerOtp, etc.)
// }
import { collection, doc, getDocs, getDoc, query, where, serverTimestamp, orderBy, runTransaction, increment, limit as fsLimit, startAfter, Timestamp, arrayUnion } from 'firebase/firestore'
import { db } from './firebase'
import { isCounterDocId, formatUserSegment, apiUrl, getAuthHeaders } from './data-common'
import { logOrderChange } from './auditLog'
import { recordChange } from './data-changeHistory'

function resolveActor(actor) {
  return String(actor || 'system')
}

// ── FCM push notifications (fire-and-forget) ──

async function postNotify(path, payload) {
  try {
    const authHeaders = await getAuthHeaders()
    const res = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload),
    })
    if (!res.ok) console.warn(`[fcm] ${path} failed`, res.status)
  } catch (err) {
    console.warn(`[fcm] ${path} network error`, err)
  }
}

// Notify staff devices of a new POS order (server reads the order doc).
export function notifyStaffNewOrder(orderNo) {
  if (!orderNo) return Promise.resolve()
  return postNotify('/api/notify-order', { orderNo })
}

// Push a status update to the customer's device (skipped server-side for
// guest/POS orders and customers without a registered token).
export function notifyCustomerStatus(orderNo, status) {
  if (!orderNo || !status) return Promise.resolve()
  return postNotify('/api/notify-status', { orderNo, status })
}

// Re-check a stuck online payment against Razorpay (staff reconciliation).
// Returns { status, updated, ... } — throws on HTTP/network failure so the
// caller can surface the error to the operator.
export async function recheckPayment(orderNo) {
  if (!orderNo) throw new Error('Missing order number')
  const authHeaders = await getAuthHeaders()
  const res = await fetch(apiUrl('/api/recheck-payment'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ orderNo }),
  })
  let body = null
  try { body = await res.json() } catch { /* noop */ }
  if (!res.ok) throw new Error(body?.error || `Re-check failed (${res.status})`)
  return body || {}
}

async function safeRecordChange(payload) {
  try {
    await recordChange(payload)
  } catch (err) {
    console.error('[changeHistory] order record failed', err)
  }
}

// ── Order creation (server-owned) ──
//
// Order-number generation and document creation both happen server-side in
// /api/place-order: the daily counter transaction and the order-document
// create are atomic there (using server time), which closes the
// ID-collision and timezone-split risks the old client-side
// generateDailyOrderNo() + setDoc() pair had (AdminBiller.jsx used to
// pre-generate the order number before creating the order — it now awaits
// this function's returned orderNo instead). Item pricing is always
// recomputed server-side from the 'menu' collection.
//
// Gated server-side on canAccess(email, 'biller') — POS order creation is a
// biller-page action, not just "any staff role".
export async function createOrder({
  userId = null,
  customer = {},
  items,
  orderType = 'delivery',
  source = 'pos',
  taxRate = null,
  status = 'placed',
  guestOrder = null,
  guestOrderDate = null,
  guestOrderAt = null,
} = {}) {
  const safeItems = Array.isArray(items) ? items : []
  if (!safeItems.length) {
    throw new Error('Order must include at least one item')
  }

  const authHeaders = await getAuthHeaders()
  const res = await fetch(apiUrl('/api/place-order'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({
      source,
      userId,
      customer,
      items: safeItems.map((item) => ({
        id: item?.id,
        name: item?.name,
        rate: item?.rate ?? item?.price ?? 0,
        qty: item?.qty,
        variantLabel: item?.variantLabel,
        mrp: item?.mrp,
        discountPercent: item?.discountPercent,
        note: item?.note,
        modifiers: item?.modifiers,
      })),
      orderType,
      paymentMethod: customer?.payment?.method || 'cod',
      taxRate,
      status,
      guestOrder,
      guestOrderDate,
      guestOrderAt,
    }),
  })
  let body = null
  try { body = await res.json() } catch { /* noop */ }
  if (!res.ok) {
    throw new Error(body?.error || `Failed to create order (${res.status})`)
  }
  const resolvedOrderNo = body.orderNo

  // Audit trail: log the create by reading the document the server just
  // persisted (creation itself happens server-side now, so there is no
  // client-side "before" snapshot to diff against — this is always a create).
  try {
    const afterSnap = await getDoc(doc(db, 'orders', resolvedOrderNo))
    await safeRecordChange({
      collection: 'orders',
      docId: resolvedOrderNo,
      before: null,
      after: afterSnap.exists() ? afterSnap.data() : null,
      action: 'create',
      performedBy: resolveActor(customer?.servedBy || (userId ? `user:${userId}` : 'system')),
      description: `Order #${resolvedOrderNo} created`,
    })
  } catch (err) {
    console.error('[changeHistory] order create record failed', err)
  }

  // Alert other staff devices (kitchen/cash manager) about the new order.
  notifyStaffNewOrder(resolvedOrderNo).catch(() => {})

  return resolvedOrderNo
}

// ── Order mutations ──

export async function updateOrder(userId, orderId, data = {}, actor = null) {
  if (!orderId) throw new Error('Missing orderId')
  const patch = (data && typeof data === 'object') ? { ...data } : {}

  let beforeState = null
  let afterState = null

  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, 'orders', orderId)
    const requestedUserId = userId || null
    let orderSnap = await tx.get(orderRef)
    let legacyNestedRef = null

    if (!orderSnap.exists() && requestedUserId) {
      const nestedRef = doc(db, 'users', requestedUserId, 'orders', orderId)
      const nestedSnap = await tx.get(nestedRef)
      if (nestedSnap.exists()) {
        orderSnap = nestedSnap
        legacyNestedRef = nestedRef
      }
    }

    if (!orderSnap.exists()) throw new Error('Order not found')

    const prev = orderSnap.data() || {}
    beforeState = { id: orderId, ...prev }
    const resolvedUserId = requestedUserId || prev.userId || null
    const actorId = actor || (resolvedUserId ? `user:${resolvedUserId}` : 'admin')

    const updatePayload = { ...patch, updatedAt: serverTimestamp(), revisionCount: increment(1) }
    if (Object.prototype.hasOwnProperty.call(patch, 'status') && patch.status !== prev.status) {
      updatePayload.statusHistory = arrayUnion({
        status: patch.status,
        note: patch.statusNote || null,
        actor: actorId,
        at: Timestamp.now(),
      })
    }
    delete updatePayload.statusNote
    afterState = { id: orderId, ...prev, ...updatePayload }

    if (legacyNestedRef) {
      tx.set(orderRef, { ...prev, ...updatePayload, userId: resolvedUserId || null }, { merge: true })
      try { tx.delete(legacyNestedRef) } catch { /* noop */ }
    } else {
      tx.set(orderRef, updatePayload, { merge: true })
    }
  })

  if (beforeState && afterState) {
    await logOrderChange('update', orderId, beforeState, afterState, actor || 'system', {
      userId,
      reason: `Order ${patch.status ? `status changed to ${patch.status}` : 'updated'}`
    }).catch(err => console.error('Failed to log order update:', err))
  }

  const latestSnap = await getDoc(doc(db, 'orders', orderId))
  const latestAfter = latestSnap.exists() ? latestSnap.data() : afterState
  const beforeStatus = String(beforeState?.status || '').toLowerCase()
  const afterStatus = String(latestAfter?.status || '').toLowerCase()
  const orderNo = String(latestAfter?.orderNo || beforeState?.orderNo || orderId)
  const description = (patch.status && beforeStatus !== afterStatus)
    ? `Order #${orderNo} moved to ${afterStatus}`
    : `Order #${orderNo} updated`

  await safeRecordChange({
    collection: 'orders',
    docId: orderId,
    before: beforeState,
    after: latestAfter,
    action: 'update',
    performedBy: resolveActor(actor),
    description,
  })

  // Push the status change to the customer's device (no-op for guest/POS
  // orders and customers without a registered FCM token)
  if (patch.status && beforeStatus !== afterStatus) {
    notifyCustomerStatus(orderNo, afterStatus).catch(() => {})
  }
}

// ── Order queries ──

export async function fetchOrder(userId, orderId) {
  const topSnap = await getDoc(doc(db, 'orders', orderId))
  if (topSnap.exists()) return { id: topSnap.id, ...topSnap.data() }
  if (userId) {
    const nestedSnap = await getDoc(doc(db, 'users', userId, 'orders', orderId))
    return nestedSnap.exists() ? { id: nestedSnap.id, ...nestedSnap.data() } : null
  }
  return null
}

export async function fetchAllOrders({ maxResults = 500, startDate = null, endDate = null, afterDoc = null } = {}) {
  try {
    const constraints = []
    if (startDate) {
      const ts = startDate instanceof Date ? Timestamp.fromDate(startDate) : startDate
      constraints.push(where('createdAt', '>=', ts))
    }
    if (endDate) {
      const ts = endDate instanceof Date ? Timestamp.fromDate(endDate) : endDate
      constraints.push(where('createdAt', '<=', ts))
    }
    constraints.push(orderBy('createdAt', 'desc'))
    if (afterDoc) constraints.push(startAfter(afterDoc))
    if (maxResults) constraints.push(fsLimit(maxResults))
    const snap = await getDocs(query(collection(db, 'orders'), ...constraints))
    const list = snap.docs
      .filter((d) => !isCounterDocId(d.id))
      .map(d => ({ id: d.id, ...d.data() }))
    return {
      orders: list,
      lastDoc: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
      hasMore: maxResults ? snap.docs.length >= maxResults : false,
    }
  } catch (err) {
    console.error('[firestore] fetchAllOrders failed', err)
    return { orders: [], lastDoc: null, hasMore: false, __error: 'other' }
  }
}

export async function fetchRecentOrders(limitCount = 10, sourceFilter = null) {
  try {
    const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), fsLimit(Math.max(10, limitCount))))
    let list = snap.docs
      .filter((d) => !isCounterDocId(d.id))
      .map(d => ({ id: d.id, ...d.data() }))
    if (sourceFilter) list = list.filter(o => (o.source || null) === sourceFilter)
    if (list.length > limitCount) list = list.slice(0, limitCount)
    return list
  } catch (err) {
    console.error('[firestore] fetchRecentOrders failed', err)
    return []
  }
}

export function nextOrderStatus(current) {
  const flow = ['placed', 'preparing', 'ready', 'delivered']
  const idx = flow.indexOf(current)
  return idx === -1 ? flow[0] : (idx < flow.length - 1 ? flow[idx + 1] : flow[idx])
}

export async function fetchLatestUserOrder(userId) {
  if (!userId) return null
  const orders = await fetchUserOrders(userId)
  return orders.length ? orders[0] : null
}

export async function fetchUserOrders(userId) {
  try {
    const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', userId), fsLimit(100)))
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    list.sort((a, b) => {
      const ta = a.createdAt?.seconds ? a.createdAt.seconds : (a.createdAt?.toMillis ? a.createdAt.toMillis() / 1000 : 0)
      const tb = b.createdAt?.seconds ? b.createdAt.seconds : (b.createdAt?.toMillis ? b.createdAt.toMillis() / 1000 : 0)
      return tb - ta
    })
    return list
  } catch (err) {
    try {
      const nested = await getDocs(query(collection(db, 'users', userId, 'orders'), orderBy('createdAt', 'desc')))
      return nested.docs.map((d) => ({ id: d.id, ...d.data() }))
    } catch {
      console.error('[firestore] fetchUserOrders failed:', err)
      return []
    }
  }
}
