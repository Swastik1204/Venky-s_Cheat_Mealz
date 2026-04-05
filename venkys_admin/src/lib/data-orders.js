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
import { collection, doc, getDocs, getDoc, query, where, setDoc, serverTimestamp, orderBy, runTransaction, increment, limit as fsLimit, startAfter, Timestamp, arrayUnion } from 'firebase/firestore'
import { db } from './firebase'
import { isCounterDocId, DAILY_COUNTER_DOC, formatUserSegment, normalizeWhatsappPhone } from './data-common'
import { logOrderChange } from './auditLog'
import { fetchAppSettings } from './data-settings'
import { sendWhatsAppInvoice } from './data-whatsapp'

// ── Order number generation ──

// Generate a daily-reset order number
export async function generateDailyOrderNo(orderType = 'dine-in', userId = null) {
  const type = String(orderType || 'dine-in').toLowerCase()
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const dateKey = `${y}${m}${d}`
  const counterRef = doc(db, 'miscellaneous', DAILY_COUNTER_DOC)
  const next = await runTransaction(db, async (tx) => {
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
  const seq = String(next).padStart(4, '0')
  const segment = formatUserSegment(userId)
  return `${dateKey}-${seq}-${segment}`
}

export async function createOrder({
  userId = null,
  customer = {},
  items,
  orderType = 'delivery',
  source = 'web',
  orderNo = null,
  taxRate = null,
  taxAmount = null,
  totalAmount = null,
  status = 'placed',
  guestOrder = null,
  guestOrderDate = null,
  guestOrderAt = null,
  cashManagerOtp = null,
  cashManagerOtpFor = null,
  cashManagerOtpVerified = null,
  cashManagerOtpVerifiedAt = null,
  cashManagerOtpVerifiedBy = null,
} = {}) {
  const safeItems = Array.isArray(items) ? items : []
  if (!safeItems.length) {
    throw new Error('Order must include at least one item')
  }

  const normalizedItems = safeItems.map((item, idx) => {
    const rate = Number(item?.rate ?? item?.price) || 0
    const qty = Number(item?.qty) || 0
    const total = Math.round(rate * qty)
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
  const subtotal = Math.round(normalizedItems.reduce((sum, it) => sum + (Number(it.total) || ((it.rate || 0) * it.qty)), 0))
  const normalizedTaxRate = typeof taxRate === 'number' ? taxRate : (taxRate != null ? Number(taxRate) : null)
  const normalizedTaxAmount = taxAmount != null ? Math.round(Number(taxAmount)) : (normalizedTaxRate != null ? Math.round(subtotal * normalizedTaxRate) : null)
  const resolvedTotalAmount = totalAmount != null ? Math.round(Number(totalAmount)) : Math.round(subtotal + (normalizedTaxAmount || 0))
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
  const normalizedStatus = String(status || 'placed').toLowerCase()
  const safeStatus = ['placed', 'preparing', 'ready', 'delivered', 'rejected'].includes(normalizedStatus) ? normalizedStatus : 'placed'

  const base = {
    userId: userId || null,
    customer: customerPayload,
    items: normalizedItems,
    subtotal,
    orderType,
    source,
    orderNo: resolvedOrderNo,
    status: safeStatus,
    statusHistory: [{ status: safeStatus, at: nowTs, actor: statusActor }],
    payment,
    totalAmount: resolvedTotalAmount,
    revisionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const normalizedOrderType = String(orderType || '').toLowerCase()
  const normalizedPayMethod = String(payment?.method || '').toLowerCase()
  const needsManagerOtp = normalizedOrderType === 'dine-in' && normalizedPayMethod === 'cod'
  if (needsManagerOtp) {
    const providedOtp = String(cashManagerOtp || '').trim()
    if (providedOtp) {
      base.cashManagerOtp = providedOtp
      base.cashManagerOtpFor = String(cashManagerOtpFor || 'dine-in-cod')
    } else {
      let otp = ''
      try {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          const buf = new Uint32Array(1)
          crypto.getRandomValues(buf)
          otp = String(buf[0] % 1000000).padStart(6, '0')
        } else {
          otp = String(Math.floor(100000 + Math.random() * 900000))
        }
      } catch {
        otp = String(Math.floor(100000 + Math.random() * 900000))
      }
      base.cashManagerOtp = otp
      base.cashManagerOtpFor = 'dine-in-cod'
    }
  }

  if (cashManagerOtpVerified != null) base.cashManagerOtpVerified = !!cashManagerOtpVerified
  if (cashManagerOtpVerifiedAt) base.cashManagerOtpVerifiedAt = cashManagerOtpVerifiedAt
  if (cashManagerOtpVerifiedBy) base.cashManagerOtpVerifiedBy = cashManagerOtpVerifiedBy
  if (guestOrder != null) base.guestOrder = !!guestOrder
  if (guestOrderDate) base.guestOrderDate = String(guestOrderDate)
  if (guestOrderAt) base.guestOrderAt = String(guestOrderAt)
  if (normalizedTaxRate != null) base.taxRate = normalizedTaxRate
  if (normalizedTaxAmount != null) base.taxAmount = normalizedTaxAmount

  const topRef = doc(db, 'orders', resolvedOrderNo)
  await setDoc(topRef, base)
  try { void notifyCashManagerOnOrder(resolvedOrderNo, base) } catch { /* noop */ }
  return resolvedOrderNo
}

// ── Notifications ──

async function notifyCashManagerOnOrder(orderId, orderPayload) {
  try {
    const settings = await fetchAppSettings()
    const phones = (Array.isArray(settings?.cashManagerPhones) ? settings.cashManagerPhones : [])
      .map((p) => normalizeWhatsappPhone(p)).filter(Boolean)
    if (!phones.length) return { __skipped: 'no_cash_manager_phone' }

    const orderNo = orderPayload?.orderNo || orderId
    const type = String(orderPayload?.orderType || '').toLowerCase()
    const method = String(orderPayload?.payment?.method || '').toLowerCase()
    const otp = orderPayload?.cashManagerOtp

    if (!(type === 'dine-in' && method === 'cod' && otp)) {
      return { __skipped: 'not_dinein_cod_or_missing_otp', orderNo }
    }

    const rawButtonParam = otp ? String(otp) : String(orderNo || '')
    const buttonParam = rawButtonParam.replace(/\s+/g, '').slice(0, 15)
    const templatePayload = {
      templateName: 'venkys_otp',
      templateLanguage: 'en',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: String(otp) },
          ],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: buttonParam }],
        },
      ]
    }
    const results = await Promise.allSettled(phones.map((p) => sendWhatsAppInvoice(p, templatePayload)))
    const ok = results.filter(r => r.status === 'fulfilled' && !r.value?.__error).length
    if (ok === 0) {
      const firstErr = results.find(r => r.status === 'fulfilled' && r.value?.__error)?.value
      try {
        console.warn('[OTP Template Failed]', JSON.stringify({
          error: firstErr?.__error,
          message: firstErr?.message,
          details: firstErr?.data?.error?.error_data?.details,
          template: { name: 'venkys_otp', language: 'en', bodyParamCount: 1, urlButtonIndex0Param: buttonParam }
        }, null, 2))
      } catch {}
      await Promise.allSettled(phones.map((p) => sendWhatsAppInvoice(p, { text: `OTP: ${otp}` })))
      return { __error: firstErr?.__error || 'template_failed', message: firstErr?.message || 'Template send failed' }
    }
    return { ok, total: phones.length }
  } catch (e) {
    return { __error: 'notify_failed', message: String(e) }
  }
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
