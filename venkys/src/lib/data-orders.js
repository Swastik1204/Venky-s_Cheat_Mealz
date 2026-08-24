// Order-related data functions
// Canonical order document schema (source of truth for reads/writes):
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
// }
import { collection, doc, getDocs, getDoc, query, where, orderBy, runTransaction, increment, limit as fsLimit, startAfter, Timestamp, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { isCounterDocId, isPermissionDenied } from './data-common'
import { apiClient } from '../utils/apiClient'

// ── Order creation (server-owned) ──
//
// Order number generation and document creation happen server-side via
// /api/place-order, eliminating the race-condition (daily counter collision)
// and timezone-split risks the old client-side generateDailyOrderNo() +
// setDoc() pair had. Item pricing is always recomputed server-side from the
// 'menu' collection, so the persisted total is never a client value.
export async function createOrder({ customer = {}, items, orderType = 'delivery', taxRate = null }) {
  const safeItems = Array.isArray(items) ? items : []
  if (!safeItems.length) {
    throw new Error('Order must include at least one item')
  }

  const paymentMethod = customer?.payment?.method || 'cod'
  const res = await apiClient.post('/api/place-order', {
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
    customer,
    orderType,
    paymentMethod,
    taxRate,
  })

  if (!res.ok) {
    throw new Error(res.message || 'Please sign in before placing an order.')
  }
  return res.data.orderNo
}

// ── Staff push notification ──

// Notify staff of a newly placed order via FCM. Fire-and-forget: the server
// reads the order document itself, so only the orderNo is sent.
export async function notifyStaffNewOrder(orderNo) {
  try {
    if (!orderNo) return { __skipped: 'missing_orderNo' }
    const res = await apiClient.post('/api/notify-order', { orderNo })
    if (!res.ok) {
      console.warn('[fcm] notify-order failed', res.status, res.body)
      return { __error: 'http_error', status: res.status }
    }
    return res.data || {}
  } catch (e) {
    console.warn('[fcm] notifyStaffNewOrder error', e)
    return { __error: 'exception', error: e?.message }
  }
}

// ── Order mutations ──

// Update order status/payment
export async function updateOrder(userId, orderId, data = {}, actor = null) {
  if (!orderId) throw new Error('Missing orderId')
  const patch = (data && typeof data === 'object') ? { ...data } : {}

  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, 'orders', orderId)
    let orderSnap = await tx.get(orderRef)
    let resolvedUserId = userId || null
    let legacyNestedRef = null

    if (!orderSnap.exists() && resolvedUserId) {
      const nestedRef = doc(db, 'users', resolvedUserId, 'orders', orderId)
      const nestedSnap = await tx.get(nestedRef)
      if (nestedSnap.exists()) {
        orderSnap = nestedSnap
        legacyNestedRef = nestedRef
      }
    }

    if (!orderSnap.exists()) {
      throw new Error('Order not found')
    }

    const prev = orderSnap.data() || {}
    resolvedUserId = resolvedUserId || prev.userId || null
    const actorId = actor || (resolvedUserId ? `user:${resolvedUserId}` : 'system')

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

    if (legacyNestedRef) {
      tx.set(orderRef, { ...prev, ...updatePayload, userId: resolvedUserId || null }, { merge: true })
      try { tx.delete(legacyNestedRef) } catch { /* noop */ }
    } else {
      tx.set(orderRef, updatePayload, { merge: true })
    }
  })
}

// ── Order queries ──

// Fetch single order
export async function fetchOrder(userId, orderId) {
  const ref = doc(db, 'orders', orderId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Fetch all top-level orders with optional pagination
export async function fetchAllOrders({ maxResults = 500, startDate = null, afterDoc = null } = {}) {
  try {
    const constraints = []
    if (startDate) {
      const ts = startDate instanceof Date ? Timestamp.fromDate(startDate) : startDate
      constraints.push(where('createdAt', '>=', ts))
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
    if (isPermissionDenied(err)) {
      return { orders: [], lastDoc: null, hasMore: false, __error: 'permission-denied' }
    }
    console.error('[firestore] fetchAllOrders failed', err)
    return { orders: [], lastDoc: null, hasMore: false, __error: 'other' }
  }
}

// Fetch recent orders
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
    if (isPermissionDenied(err)) return []
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
    if (isPermissionDenied(err)) {
      try {
        const nested = await getDocs(query(collection(db, 'users', userId, 'orders'), orderBy('createdAt', 'desc')))
        return nested.docs.map((d) => ({ id: d.id, ...d.data() }))
      } catch {
        console.warn('[firestore] Orders read denied by rules for current user.', err)
        return []
      }
    }
    console.error('[firestore] fetchUserOrders failed:', err)
    return []
  }
}
