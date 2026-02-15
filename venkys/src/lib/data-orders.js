// Order-related data functions
import { collection, doc, getDocs, getDoc, query, where, setDoc, serverTimestamp, orderBy, runTransaction, increment, limit as fsLimit, startAfter, Timestamp, arrayUnion } from 'firebase/firestore'
import { db } from './firebase'
import { isCounterDocId, DAILY_COUNTER_DOC, formatUserSegment, isPermissionDenied, apiUrl, getAuthHeaders } from './data-common'
import { fetchAppSettings } from './data-settings'

// Generate a daily-reset order number like YYYYMMDD-SEQ-USERSEGMENT
export async function generateDailyOrderNo(orderType = 'dine-in', userId = null) {
  const type = String(orderType || 'dine-in').toLowerCase()
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const dateKey = `${y}${m}${d}`
  const counterRef = doc(db, 'miscellaneous', DAILY_COUNTER_DOC)
  let next = null
  try {
    next = await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef)
      const data = snap.exists() ? snap.data() : {}
      const currentDateKey = data.currentDate || ''
      const currentTotal = currentDateKey === dateKey ? (Number(data.total) || 0) : 0
      const newTotal = currentTotal + 1
      tx.set(counterRef, {
        currentDate: dateKey,
        total: newTotal,
        lastOrderType: type,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      return newTotal
    })
  } catch (err) {
    if (!isPermissionDenied(err)) throw err
    next = null
  }
  const seq = next != null
    ? String(next).padStart(4, '0')
    : String((Date.now() % 10000)).padStart(4, '0')
  const segment = formatUserSegment(userId)
  return `${dateKey}-${seq}-${segment}`
}

export async function createOrder({ userId = null, customer = {}, items, orderType = 'delivery', source = 'web', orderNo = null, taxRate = null, taxAmount = null, totalAmount = null }) {
  if (String(source || '').toLowerCase() === 'web' && !userId) {
    throw new Error('Please sign in before placing an order.')
  }
  const safeItems = Array.isArray(items) ? items : []
  if (!safeItems.length) {
    throw new Error('Order must include at least one item')
  }

  const normalizedItems = safeItems.map((item, idx) => {
    const rate = Number(item?.rate ?? item?.price) || 0
    const qty = Number(item?.qty) || 0
    const total = Number((rate * qty).toFixed(2))
    const normalized = {
      id: item?.id || `item-${idx + 1}`,
      name: String(item?.name || `Item ${idx + 1}`).trim(),
      rate,
      qty,
      total,
    }
    if (item?.mrp != null) normalized.mrp = Number(item.mrp) || null
    if (item?.discountPercent != null) normalized.discountPercent = Number(item.discountPercent) || null
    if (item?.variantLabel) normalized.variantLabel = String(item.variantLabel)
    if (item?.note) normalized.note = String(item.note)
    if (item?.modifiers) normalized.modifiers = item.modifiers
    return normalized
  })
  const subtotal = Number(normalizedItems.reduce((sum, it) => sum + (Number(it.total) || ((it.rate || 0) * it.qty)), 0).toFixed(2))
  const normalizedTaxRate = typeof taxRate === 'number' ? taxRate : (taxRate != null ? Number(taxRate) : null)
  const normalizedTaxAmount = taxAmount != null ? Number(taxAmount) : (normalizedTaxRate != null ? Number((subtotal * normalizedTaxRate).toFixed(2)) : null)
  const resolvedTotalAmount = totalAmount != null ? Number(totalAmount) : Number((subtotal + (normalizedTaxAmount || 0)).toFixed(2))
  const resolvedOrderNo = orderNo || await generateDailyOrderNo(orderType, userId || customer?.servedBy || customer?.phone || null)

  const payment = (() => {
    const raw = customer?.payment && typeof customer.payment === 'object' ? customer.payment : {}
    return {
      method: raw.method || 'cod',
      status: raw.status || 'pending',
      reference: raw.reference || null,
      collectedBy: raw.collectedBy || null,
      collectedAt: raw.collectedAt || null,
      metadata: raw.metadata || null,
    }
  })()

  const customerPayload = {
    name: customer?.name ? String(customer.name).trim() : '',
    phone: customer?.phone ? String(customer.phone).trim() : '',
    address: customer?.address || '',
    instructions: customer?.instructions || '',
    landmark: customer?.landmark || '',
    servedBy: customer?.servedBy || '',
    table: customer?.table || '',
    payment,
  }
  if (customer?.email) customerPayload.email = String(customer.email).trim()
  if (customer?.geoHash) customerPayload.geoHash = customer.geoHash
  if (customer?.location) customerPayload.location = customer.location

  const statusActor = source === 'pos' ? 'pos' : (userId ? `user:${userId}` : 'guest')
  const nowTs = Timestamp.now()

  const base = {
    userId: userId || null,
    customer: customerPayload,
    items: normalizedItems,
    subtotal,
    orderType,
    source,
    orderNo: resolvedOrderNo,
    status: 'placed',
    statusHistory: [{ status: 'placed', at: nowTs, actor: statusActor }],
    payment,
    totalAmount: resolvedTotalAmount,
    revisionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  if (normalizedTaxRate != null) base.taxRate = normalizedTaxRate
  if (normalizedTaxAmount != null) base.taxAmount = normalizedTaxAmount

  const topRef = doc(db, 'orders', resolvedOrderNo)
  let topLevelPersisted = false
  try {
    await setDoc(topRef, base)
    topLevelPersisted = true
    if (String(base?.source || '').toLowerCase() !== 'pos') {
      try { void notifyOrderMessengers(base) } catch { /* noop */ }
    }
  } catch (err) {
    if (err?.code !== 'permission-denied') {
      throw err
    }
    if (import.meta.env?.DEV) {
      console.warn('[orders] Skipping top-level order write due to permission-denied rule.')
    }
  }

  if (topLevelPersisted) return resolvedOrderNo
  throw new Error('You need to sign in before placing an order.')
}

// Send order notification to all order messenger phone numbers
async function notifyOrderMessengers(orderPayload) {
  try {
    const settings = await fetchAppSettings()
    const phones = Array.isArray(settings?.orderMessengerPhones) ? settings.orderMessengerPhones : []
    const validPhones = phones
      .map((p) => String(p || '').replace(/\D/g, ''))
      .filter((digits) => digits.length === 10)

    if (!validPhones.length) {
      return { __skipped: 'no_order_messenger_phones' }
    }

    const customerName = String(orderPayload?.customer?.name || 'Customer').trim() || 'Customer'
    const totalAmount = Number(orderPayload?.totalAmount ?? orderPayload?.subtotal ?? 0)
    const rawAddr = orderPayload?.customer?.address || ''
    let address = '-'
    if (typeof rawAddr === 'string' && rawAddr.trim()) {
      address = rawAddr.trim()
    } else if (typeof rawAddr === 'object') {
      const parts = [rawAddr.line1, rawAddr.line2, rawAddr.landmark, rawAddr.city, rawAddr.state, rawAddr.pin]
        .map(v => (v == null ? '' : String(v).trim()))
        .filter(Boolean)
      address = parts.length ? parts.join(', ') : '-'
    }
    const orderId = String(orderPayload?.orderNo || orderPayload?.id || '').trim()

    const sendPromises = validPhones.map(async (phone) => {
      try {
        const url = apiUrl('/api/send-order-messenger')
        const authHeaders = await getAuthHeaders()
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ phone, customerName, totalAmount, address, orderId: orderId || undefined }),
        })
        let body = null
        try { body = await res.json() } catch { /* ignore */ }
        const msgId = body?.msgId || body?.data?.messages?.[0]?.id || ''
        if (res.ok && msgId) {
          return { phone, success: true, msgId, result: body }
        }
        return { phone, success: false, error: body }
      } catch (e) {
        console.error('[notifyOrderMessengers] Error sending to', phone, e)
        return { phone, success: false, error: String(e) }
      }
    })

    const results = await Promise.all(sendPromises)
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    return { results, successful, failed }
  } catch (e) {
    console.error('[notifyOrderMessengers] Error:', e)
    return { __error: 'notify_failed', message: String(e) }
  }
}

// Optional WhatsApp sender
export async function sendWhatsAppInvoice(phone, payload) {
  try {
    const digits = String(phone || '').replace(/\D/g, '')
    const normalizedPhone = digits.length === 10 ? `91${digits}` : digits
    if (!normalizedPhone) return { __skipped: 'missing_phone' }

    const url = apiUrl('/api/send-whatsapp')
    const authHeaders = await getAuthHeaders()
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ phone: normalizedPhone, payload })
    })
    let body = null
    try { body = await res.json() } catch {}
    if (!res.ok) {
      const errObj = { __error: 'http_error', status: res.status, ...(body || {}) }
      try { console.warn('[wa] send failed', JSON.stringify(errObj, null, 2)) } catch {}
      return errObj
    }
    return body || {}
  } catch (e) {
    const errObj = { __error: 'network', message: String(e) }
    try { console.warn('[wa] send failed', errObj) } catch {}
    return errObj
  }
}

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
