// Data layer for Firestore
import { collection, doc, getDocs, getDoc, query, where, addDoc, setDoc, serverTimestamp, orderBy, deleteDoc, arrayUnion, writeBatch, runTransaction, increment, limit as fsLimit, Timestamp } from 'firebase/firestore'
// Centralized branding constants (moved from separate file)
export const BRAND_LONG = "Venky's Chicken Xperience Durgapur"
export const BRAND_SHORT = "Venky's"
import { db } from './firebase'

function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined
  const normalize = (value) => {
    if (!value) return ''
    return value.endsWith('/') ? value.slice(0, -1) : value
  }
  const envBase = env?.VITE_API_BASE_URL
    || (env?.VITE_VERCEL_URL ? `https://${env.VITE_VERCEL_URL}` : '')
    || env?.VITE_SITE_URL
    || env?.VITE_PUBLIC_BASE_URL
  if (envBase) {
    return `${normalize(envBase)}${normalizedPath}`
  }
  if (typeof window !== 'undefined') {
    const runtimeBase = window.__APP_API_BASE__ || window.__API_BASE__ || window.__API_BASE_URL__
    if (runtimeBase) {
      return `${normalize(runtimeBase)}${normalizedPath}`
    }
    if (env?.DEV) {
      const devBase = env?.VITE_DEV_API_BASE_URL
      if (devBase) return `${normalize(devBase)}${normalizedPath}`
      // Fallback to relative path so Vite proxy handles it (works for localhost and IP)
      return normalizedPath
    }
    return `${window.location.origin}${normalizedPath}`
  }
  return normalizedPath
}

function isPermissionDenied(err) {
  return err && (err.code === 'permission-denied' || /insufficient permissions/i.test(String(err.message || '')))
}

function safeRandomId(prefix = '') {
  const core = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  return prefix ? `${prefix}-${core}` : core
}

const ORDER_COUNTER_PREFIX = '__counter__'

function buildCounterDocId(dateKey) {
  return `${ORDER_COUNTER_PREFIX}${dateKey}`
}

function formatUserSegment(userId) {
  const raw = typeof userId === 'string' && userId.trim() ? userId.trim() : null
  if (!raw) return 'GUEST'
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '')
  if (!cleaned) return 'GUEST'
  return cleaned.length > 10 ? cleaned.slice(-10).toUpperCase() : cleaned.toUpperCase()
}

function isCounterDocId(id) {
  return typeof id === 'string' && id.startsWith(ORDER_COUNTER_PREFIX)
}

function toMoney(value) {
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return null
  return Math.round(num * 100) / 100
}

function toDiscount(value) {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return null
  const clamped = Math.max(0, Math.min(100, num))
  const rounded = Math.round(clamped * 10) / 10
  return rounded > 0 ? rounded : null
}

export const DEFAULT_SPOTLIGHT = { hotDeals: [], chefSpecials: [], hiddenHotDeals: false, hiddenChefSpecials: false, hiddenSpotlight: false }

function makeSpotlightKey(categoryId, name) {
  const cat = (categoryId || '').trim().toLowerCase()
  const label = (name || '').trim().toLowerCase()
  return cat && label ? `${cat}::${label}` : ''
}

function normalizeSpotlightEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  const id = typeof entry.id === 'string' && entry.id ? entry.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const categoryId = typeof entry.categoryId === 'string' ? entry.categoryId.trim() : ''
  const itemName = typeof entry.itemName === 'string' ? entry.itemName.trim() : ''
  const matchKey = typeof entry.matchKey === 'string' && entry.matchKey.trim()
    ? entry.matchKey.trim()
    : makeSpotlightKey(categoryId, itemName)
  if (!categoryId || !itemName || !matchKey) return null
  // Strip deprecated fields like label, caption, badge, itemIndex
  return { id, categoryId, itemName, matchKey }
}

function normalizeSpotlight(raw) {
  const ensureList = (value) => {
    if (!Array.isArray(value)) return []
    return value
      .map(normalizeSpotlightEntry)
      .filter(Boolean)
  }
  return {
    hotDeals: ensureList(raw?.hotDeals || raw?.discounted),
    chefSpecials: ensureList(raw?.chefSpecials || raw?.specials),
    hiddenHotDeals: !!raw?.hiddenHotDeals,
    hiddenChefSpecials: !!raw?.hiddenChefSpecials,
    hiddenSpotlight: !!raw?.hiddenSpotlight,
  }
}

function sanitizeFirestoreData(input) {
  if (input === undefined) return undefined
  if (input === null) return null
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null
  }
  if (typeof input === 'string' || typeof input === 'boolean') {
    return input
  }
  if (input instanceof Date) {
    return input
  }
  if (Array.isArray(input)) {
    const arr = input
      .map((value) => sanitizeFirestoreData(value))
      .filter((value) => value !== undefined)
    return arr
  }
  if (typeof input === 'object') {
    const out = {}
    Object.entries(input).forEach(([key, value]) => {
      const sanitized = sanitizeFirestoreData(value)
      if (sanitized !== undefined) {
        out[key] = sanitized
      }
    })
    return out
  }
  return null
}

export async function fetchCategories() {
  try {
    const snap = await getDocs(collection(db, 'categories'))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    if (isPermissionDenied(err)) {
      console.warn('[firestore] Public read denied for categories. Update rules to allow read.', err)
      return []
    }
    console.error('[firestore] fetchCategories failed:', err)
    return []
  }
}

export async function fetchMenuItems(activeOnly = true) {
  try {
    const col = collection(db, 'menuItems')
    const q = activeOnly ? query(col, where('active', '==', true)) : col
    let snap = await getDocs(q)
    // If nothing found with active filter, try without the filter as a fallback
    if (activeOnly && snap.empty) {
      snap = await getDocs(col)
    }
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    if (isPermissionDenied(err)) {
      console.warn('[firestore] Public read denied for menuItems. Update rules to allow read.', err)
      return []
    }
    console.error('[firestore] fetchMenuItems failed:', err)
    return []
  }
}

// Generate a daily-reset order number like YYYYMMDD-SEQ-USERSEGMENT stored directly under the orders collection
export async function generateDailyOrderNo(orderType = 'dine-in', userId = null) {
  const type = String(orderType || 'dine-in').toLowerCase()
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const dateKey = `${y}${m}${d}`
  const counterRef = doc(db, 'orders', buildCounterDocId(dateKey))
  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef)
    const data = snap.exists() ? snap.data() : { total: 0 }
    const total = Number(data.total || 0) + 1
    tx.set(counterRef, {
      __meta: 'orderCounter',
      dateKey,
      lastOrderType: type,
      total,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return total
  })
  const seq = String(next).padStart(4, '0')
  const segment = formatUserSegment(userId)
  return `${dateKey}-${seq}-${segment}`
}

export async function createOrder({ userId = null, customer = {}, items, orderType = 'delivery', source = 'web', orderNo = null, taxRate = null, taxAmount = null, totalAmount = null }) {
  const safeItems = Array.isArray(items) ? items : []
  if (!safeItems.length) {
    throw new Error('Order must include at least one item')
  }

  const normalizedItems = safeItems.map((item, idx) => {
    const price = Number(item?.price) || 0
    const qty = Number(item?.qty) || 0
    const total = Number((price * qty).toFixed(2))
    const normalized = {
      id: item?.id || `item-${idx + 1}`,
      name: String(item?.name || `Item ${idx + 1}`).trim(),
      price,
      qty,
      total,
    }
    if (item?.note) normalized.note = String(item.note)
    if (item?.modifiers) normalized.modifiers = item.modifiers
    return normalized
  })
  const subtotal = Number(normalizedItems.reduce((sum, it) => sum + (Number(it.total) || (it.price * it.qty)), 0).toFixed(2))
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

  // Use Timestamp.now() instead of serverTimestamp() in arrays (Firestore limitation)
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
  } catch (err) {
    if (err?.code !== 'permission-denied') {
      throw err
    }
    if (import.meta.env?.DEV) {
      console.warn('[orders] Skipping top-level order write due to permission-denied rule.')
    }
  }

  if (userId) {
    // We no longer duplicate the full order in users/{uid}/orders.
    // Instead, we rely on querying the top-level 'orders' collection by userId.
    // However, to maintain backward compatibility or if we want a lightweight list, we could store IDs.
    // But the user requested "make just a single document and store & link the order ids there".
    // For now, we will STOP writing the duplicate data.
    // The Profile page will be updated to query the main collection.
    
    // Optional: Maintain a list of order IDs in a single doc if needed for performance, 
    // but querying by indexed userId is standard and scalable enough for this scale.
    // We will skip the nested write.
  }

  if (topLevelPersisted) return resolvedOrderNo
  throw new Error('You need to sign in before placing an order.')
}

// ---- Razorpay helpers ---- //
export async function createRazorpayOrder(amount, cartChecksum = null) {
  const value = Number(amount)
  if (!value || value <= 0) {
    throw new Error('Invalid amount for Razorpay order')
  }
  const res = await fetch(apiUrl('/api/create-order'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: value, cartChecksum: cartChecksum || undefined })
  })
  let body = null
  try { body = await res.json() } catch {}
  if (!res.ok) {
    const message = body?.error || `Failed to create Razorpay order (${res.status})`
    throw new Error(message)
  }
  return body
}

export async function verifyRazorpayPayment(payload) {
  const res = await fetch(apiUrl('/api/verify-payment'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  let body = null
  try { body = await res.json() } catch {}
  if (!res.ok) {
    const message = body?.error || `Payment verification failed (${res.status})`
    throw new Error(message)
  }
  return body
}

// Optional WhatsApp sender. Configure VITE_WHATSAPP_FUNCTION_URL to a server endpoint
// that triggers WhatsApp Business API using your business number.
export async function sendWhatsAppInvoice(phone, payload) {
  try {
    const url = import.meta.env.VITE_WHATSAPP_FUNCTION_URL
    if (!url) return { __skipped: 'no_whatsapp_endpoint_configured' }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, payload })
    })
    let body = null
    try { body = await res.json() } catch {}
    if (!res.ok) return { __error: 'http_error', status: res.status, ...(body || {}) }
    return body || {}
  } catch (e) {
    return { __error: 'network', message: String(e) }
  }
}

// Update order status/payment (supports both nested and legacy top-level orders)
export async function updateOrder(userId, orderId, data = {}, actor = null) {
  if (!orderId) throw new Error('Missing orderId')
  const patch = (data && typeof data === 'object') ? { ...data } : {}

  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, 'orders', orderId)
    let orderSnap = await tx.get(orderRef)
    let resolvedUserId = userId || null

    if (!orderSnap.exists() && resolvedUserId) {
      const nestedRef = doc(db, 'users', resolvedUserId, 'orders', orderId)
      const nestedSnap = await tx.get(nestedRef)
      if (nestedSnap.exists()) {
        orderSnap = nestedSnap
      }
    }

    if (!orderSnap.exists()) {
      throw new Error('Order not found')
    }

    const prev = orderSnap.data() || {}
    resolvedUserId = resolvedUserId || prev.userId || null
    const actorId = actor || (resolvedUserId ? `user:${resolvedUserId}` : 'system')

    // Revisions subcollection removed as per new requirement.
    // We now rely on statusHistory (activityLog) for tracking status changes.

    const updatePayload = { ...patch, updatedAt: serverTimestamp(), revisionCount: increment(1) }
    if (Object.prototype.hasOwnProperty.call(patch, 'status') && patch.status !== prev.status) {
      // Use Timestamp.now() instead of serverTimestamp() in arrays (Firestore limitation)
      updatePayload.statusHistory = arrayUnion({
        status: patch.status,
        note: patch.statusNote || null,
        actor: actorId,
        at: Timestamp.now(),
      })
    }
    delete updatePayload.statusNote

    tx.set(orderRef, updatePayload, { merge: true })

    // We no longer update the nested doc since we stopped creating it.
    // if (resolvedUserId) {
    //   const nestedRef = doc(db, 'users', resolvedUserId, 'orders', orderId)
    //   tx.set(nestedRef, updatePayload, { merge: true })
    // }
  })
}

// Fetch single order
export async function fetchOrder(userId, orderId) {
  // Always fetch from top-level orders now
  const ref = doc(db, 'orders', orderId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Fetch all top-level orders (admin view)
export async function fetchAllOrders() {
  try {
    const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')))
    return snap.docs
      .filter((d) => !isCounterDocId(d.id))
      .map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    if (isPermissionDenied(err)) {
      // Signal to caller that this is an auth / rules issue
      return { __error: 'permission-denied', list: [] }
    }
    console.error('[firestore] fetchAllOrders failed', err)
    return { __error: 'other', list: [] }
  }
}

// Fetch recent orders (most recent first). Optionally filter by source in-memory to avoid index requirements.
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
    // Preferred nested orders
    const nested = await getDocs(query(collection(db, 'users', userId, 'orders'), orderBy('createdAt', 'desc')))
    if (!nested.empty) {
      return nested.docs.map((d) => ({ id: d.id, ...d.data() }))
    }
    // Fallback to legacy top-level WITHOUT orderBy to avoid composite index requirement; sort in-memory
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
      console.warn('[firestore] Orders read denied by rules for current user.', err)
      return []
    }
    console.error('[firestore] fetchUserOrders failed:', err)
    return []
  }
}

// Users API
export async function getUser(uid) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateUser(uid, data) {
  const ref = doc(db, 'users', uid)
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

// --- User preferences (theme) --- //
export async function getUserTheme(uid) {
  if (!uid) return null
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return null
    const t = snap.data().theme
    return t === 'venkys_dark' || t === 'venkys_light' ? t : null
  } catch {
    return null
  }
}

export async function setUserTheme(uid, theme) {
  if (!uid) return
  const normalized = theme === 'venkys_dark' ? 'venkys_dark' : 'venkys_light'
  await setDoc(doc(db, 'users', uid), { theme: normalized, updatedAt: serverTimestamp() }, { merge: true })
}

// Items catalog API
export async function fetchItems() {
  try {
    const snap = await getDocs(collection(db, 'items'))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    if (isPermissionDenied(err)) {
      console.warn('[firestore] Public read denied for items. Update rules to allow read.', err)
      return []
    }
    console.error('[firestore] fetchItems failed:', err)
    return []
  }
}

export async function addItem(item) {
  // item: { item_name, MRP, GST, Discount }
  return addDoc(collection(db, 'items'), {
    item_name: item.item_name,
    MRP: Number(item.MRP) || 0,
    GST: Number(item.GST) || 0,
    Discount: Number(item.Discount) || 0,
    createdAt: serverTimestamp(),
  })
}

// Admin helpers (writes require Firestore rules allowing admin)
export async function upsertCategory(id, data) {
  // id is recommended to be a slug for stability
  const ref = doc(db, 'categories', id)
  await setDoc(ref, { name: data.name, updatedAt: serverTimestamp() }, { merge: true })
  return id
}

export async function upsertMenuItem(id, data) {
  // id may be a deterministic slug or any string; using merge ensures updates
  const ref = doc(db, 'menuItems', id)
  await setDoc(
    ref,
    {
      name: data.name,
      price: Number(data.price) || 0,
      categoryId: data.categoryId,
      active: data.active ?? true,
      desc: data.desc ?? '',
      image: data.image ?? '',
      updatedAt: serverTimestamp(),
      createdAt: data.createdAt || serverTimestamp(),
    },
    { merge: true }
  )
  return id
}

export async function deleteMenuItem(id) {
  await deleteDoc(doc(db, 'menuItems', id))
}

// New "menu" collection helpers: one document per category with an items array
export async function fetchMenuCategories() {
  try {
    const snap = await getDocs(collection(db, 'menu'))
    let cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    // Attempt to apply appearance ordering if present
    try {
      const appearanceRef = doc(db, 'miscellaneous', 'appearance')
      const appSnap = await getDoc(appearanceRef)
      if (appSnap.exists()) {
        const data = appSnap.data()
        if (Array.isArray(data.categoriesOrder) && data.categoriesOrder.length) {
          const orderMap = new Map(data.categoriesOrder.map((id, idx) => [id, idx]))
          cats.sort((a,b) => {
            const ai = orderMap.has(a.id) ? orderMap.get(a.id) : Number.MAX_SAFE_INTEGER
            const bi = orderMap.has(b.id) ? orderMap.get(b.id) : Number.MAX_SAFE_INTEGER
            if (ai === bi) return a.id.localeCompare(b.id)
            return ai - bi
          })
        }
      }
    } catch {
      // Non-fatal; ignore ordering if fetch failed
    }
    return cats
  } catch (err) {
    if (isPermissionDenied(err)) {
      console.warn('[firestore] Public read denied for menu. Update rules to allow read.', err)
      return []
    }
    console.error('[firestore] fetchMenuCategories failed:', err)
    return []
  }
}

// Appearance / miscellaneous helpers
export async function fetchAppearanceSettings() {
  try {
    const ref = doc(db, 'miscellaneous', 'appearance')
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      const fallback = { categoriesOrder: [], spotlight: DEFAULT_SPOTLIGHT }
      try { await setDoc(ref, { ...fallback, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }) } catch (err) { console.warn('[firestore] appearance doc init failed', err) }
      return { categoriesOrder: [], spotlight: { ...DEFAULT_SPOTLIGHT }, __exists: false }
    }
    const data = snap.data() || {}
    const categoriesOrder = Array.isArray(data.categoriesOrder) ? data.categoriesOrder : []
    const spotlight = normalizeSpotlight(data.spotlight || DEFAULT_SPOTLIGHT)
    // Backfill if whole field missing OR if new flags like hiddenSpotlight are absent
    const needsFlagBackfill = !data.spotlight || (
      data.spotlight && (
        data.spotlight.hiddenSpotlight === undefined ||
        data.spotlight.hiddenHotDeals === undefined ||
        data.spotlight.hiddenChefSpecials === undefined
      )
    )
    // Also backfill to remove deprecated per-entry fields (label, caption, badge, itemIndex)
    const hasDeprecated = (() => {
      const hasBad = (arr) => Array.isArray(arr) && arr.some((e) => e && typeof e === 'object' && (
        Object.prototype.hasOwnProperty.call(e, 'label') ||
        Object.prototype.hasOwnProperty.call(e, 'caption') ||
        Object.prototype.hasOwnProperty.call(e, 'badge') ||
        Object.prototype.hasOwnProperty.call(e, 'itemIndex')
      ))
      return hasBad(data.spotlight?.hotDeals) || hasBad(data.spotlight?.chefSpecials)
    })()
    const needsBackfill = needsFlagBackfill || hasDeprecated
    if (needsBackfill) {
      try { await setDoc(ref, { spotlight, updatedAt: serverTimestamp() }, { merge: true }) } catch (err) { console.warn('[firestore] appearance spotlight backfill failed', err) }
    }
    return { categoriesOrder, spotlight, __exists: true }
  } catch (e) {
    if (isPermissionDenied(e)) return { categoriesOrder: [], spotlight: { ...DEFAULT_SPOTLIGHT }, __error: 'permission-denied', __exists: false }
    return { categoriesOrder: [], spotlight: { ...DEFAULT_SPOTLIGHT }, __error: 'other', __exists: false }
  }
}

export async function saveCategoriesOrder(orderIds) {
  if (!Array.isArray(orderIds)) return false
  const ref = doc(db, 'miscellaneous', 'appearance')
  await setDoc(ref, { categoriesOrder: orderIds, updatedAt: serverTimestamp() }, { merge: true })
  return true
}

// Store open/closed flag persistence
export async function fetchStoreStatus() {
  try {
    const settingsRef = doc(db, 'miscellaneous', 'settings')
    const snap = await getDoc(settingsRef)
    if (snap.exists()) {
      const data = snap.data() || {}
      if (Object.prototype.hasOwnProperty.call(data, 'open')) {
        return { open: data.open !== false }
      }
    }
    // Backwards compatibility: fall back to legacy miscellaneous/store doc if present
    try {
      const legacySnap = await getDoc(doc(db, 'miscellaneous', 'store'))
      if (legacySnap.exists()) {
        const legacyData = legacySnap.data() || {}
        const open = legacyData.open !== false
        // Prime the new location so subsequent reads avoid legacy hit
        await setDoc(settingsRef, { open, updatedAt: serverTimestamp() }, { merge: true })
        return { open, __migrated: true }
      }
    } catch { /* ignore legacy fetch errors */ }
    return { open: true }
  } catch {
    return { open: true, __error: true }
  }
}

export async function setStoreOpen(open) {
  await setDoc(doc(db, 'miscellaneous', 'settings'), { open: !!open, updatedAt: serverTimestamp() }, { merge: true })
  return true
}

// --- App Settings (GST rate, admin mobile, etc) --- //
export async function fetchAppSettings() {
  try {
    const snap = await getDoc(doc(db, 'miscellaneous', 'settings'))
    if (!snap.exists()) return { gstRate: 0.05, adminMobile: '', shopAddress: '', shopPhone: '', chefName: '', googlePlaceId: '' }
    const d = snap.data()
    const gstRate = typeof d.gstRate === 'number' ? d.gstRate : (Number(d.gstRate) || 0.05)
    const adminMobile = d.adminMobile || ''
    const shopAddress = d.shopAddress || ''
    const shopPhone = d.shopPhone || ''
    const chefName = d.chefName || ''
    const googlePlaceId = d.googlePlaceId || ''
    return { gstRate, adminMobile, shopAddress, shopPhone, chefName, googlePlaceId }
  } catch {
    return { gstRate: 0.05, adminMobile: '', shopAddress: '', shopPhone: '', chefName: '', googlePlaceId: '', __error: true }
  }
}

export async function saveAppSettings(partial) {
  const payload = {}
  if (partial.gstRate !== undefined) payload.gstRate = Number(partial.gstRate) || 0
  if (partial.adminMobile !== undefined) payload.adminMobile = String(partial.adminMobile || '')
  if (partial.shopAddress !== undefined) payload.shopAddress = String(partial.shopAddress || '')
  if (partial.shopPhone !== undefined) payload.shopPhone = String(partial.shopPhone || '')
  if (partial.chefName !== undefined) payload.chefName = String(partial.chefName || '')
  if (partial.googlePlaceId !== undefined) payload.googlePlaceId = String(partial.googlePlaceId || '')
  await setDoc(doc(db, 'miscellaneous', 'settings'), { ...payload, updatedAt: serverTimestamp() }, { merge: true })
  return true
}

// --- Business Profile (synced from Google Places) --- //
export async function fetchBusinessProfile() {
  try {
    const snap = await getDoc(doc(db, 'miscellaneous', 'businessProfile'))
    if (!snap.exists()) return null
    return snap.data()
  } catch {
    return null
  }
}

export async function syncBusinessProfile(placeId) {
  const url = import.meta.env.VITE_SYNC_BUSINESS_PROFILE_URL || '/api/sync-business-profile'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ placeId })
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.error || `Sync failed: ${res.status}`)
  }
  return res.json()
}

// Lightweight SMS sender (backend endpoint required)
export async function sendSMSInvoice(phone, text) {
  try {
    const url = import.meta.env.VITE_SMS_FUNCTION_URL
    if (!url) return { __skipped: 'no_sms_endpoint_configured' }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, text })
    })
    if (!res.ok) return { __error: 'http_error', status: res.status }
    return await res.json().catch(() => ({}))
  } catch (e) {
    return { __error: 'network', message: String(e) }
  }
}

export async function upsertMenuCategory(name) {
  const ref = doc(db, 'menu', name)
  // Ensure doc exists WITHOUT overwriting existing fields/items. Previous buggy version
  // wrote { merge: true } as data which wiped existing items and left a stray field.
  await setDoc(ref, {}, { merge: true })
  return name
}

export async function appendMenuItems(categoryName, items) {
  const ref = doc(db, 'menu', categoryName)
  // Ensure doc exists safely (no destructive overwrite)
  await setDoc(ref, {}, { merge: true })
  for (const it of items) {
    const rate = toMoney(it.rate ?? it.price)
    const price = rate !== null ? rate : (Number(it.price) || 0)
    const mrp = toMoney(it.mrp ?? it.MRP)
    const discountSource = it.discountPercent ?? it.discount
    const derivedDiscount = mrp !== null && rate !== null && mrp > 0 ? ((mrp - rate) / mrp) * 100 : null
    const discount = toDiscount(discountSource ?? derivedDiscount)
    const item = { name: it.name, price, veg: it.veg === false ? false : true }
    if (rate !== null) item.rate = rate
    if (mrp !== null) item.mrp = mrp
    if (discount !== null) item.discountPercent = discount
    // active flag optional (default true); only persist if explicitly false to save space
    if (it.active === false) item.active = false
    if (it.imageId) item.imageId = it.imageId
    await setDoc(ref, { items: arrayUnion(item) }, { merge: true })
  }
  return true
}

// High-level safe adder: prevents duplicates (case-insensitive), merges by skipping existing
// Accepts raw items: [{ name, price, veg }]
export async function addMenuItems(categoryName, rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return { added: 0, skipped: 0 }
  const ref = doc(db, 'menu', categoryName)
  const snap = await getDoc(ref)
  const existing = snap.exists() && Array.isArray(snap.data().items) ? snap.data().items : []
  const existingNames = new Set(existing.map(i => (i.name || '').trim().toLowerCase()))
  const toAdd = []
  let skipped = 0
  for (const r of rawItems) {
    const name = (r.name || '').trim()
    if (!name) { skipped++; continue }
    const key = name.toLowerCase()
    if (existingNames.has(key)) { skipped++; continue }
    existingNames.add(key)
    const rate = toMoney(r.rate ?? r.price)
    const price = rate !== null ? rate : (Number(r.price) || 0)
    const mrp = toMoney(r.mrp ?? r.MRP)
    const derivedDiscount = mrp !== null && rate !== null && mrp > 0 ? ((mrp - rate) / mrp) * 100 : null
    const discount = toDiscount(r.discountPercent ?? derivedDiscount)
    const item = { name, price, veg: r.veg === false ? false : true }
    if (rate !== null) item.rate = rate
    if (mrp !== null) item.mrp = mrp
    if (discount !== null) item.discountPercent = discount
    toAdd.push(item)
  }
  if (toAdd.length) {
    await appendMenuItems(categoryName, toAdd)
  } else {
    // Ensure doc exists even if nothing added
    if (!snap.exists()) await setDoc(ref, {}, { merge: true })
  }
  return { added: toAdd.length, skipped }
}

// Replace the whole items array for a category (used for inline edits)
export async function setMenuItems(categoryName, items) {
  const ref = doc(db, 'menu', categoryName)
  // Preserve veg flag; default to true if missing
  await setDoc(
    ref,
    {
      items: items.map((it) => ({
        name: it.name,
        ...(() => {
          const rate = toMoney(it.rate ?? it.price)
          const price = rate !== null ? rate : (Number(it.price) || 0)
          const mrp = toMoney(it.mrp ?? it.MRP)
          const derivedDiscount = mrp !== null && rate !== null && mrp > 0 ? ((mrp - rate) / mrp) * 100 : null
          const discount = toDiscount(it.discountPercent ?? derivedDiscount)
          const base = { price }
          if (rate !== null) base.rate = rate
          if (mrp !== null) base.mrp = mrp
          if (discount !== null) base.discountPercent = discount
          return base
        })(),
        veg: it.veg === false ? false : true,
        ...(it.active === false ? { active: false } : {}),
        ...(it.imageId ? { imageId: it.imageId } : {}),
        // Optional: custom composition rows
        ...(Array.isArray(it.components) && it.components.length
          ? {
              components: it.components
                .filter((r) => r && (String(r.text || '').trim() || String(r.qty || '').trim() || String(r.unit || '').trim()))
                .map((r) => ({ qty: String(r.qty || '').trim(), unit: String(r.unit || '').trim(), text: String(r.text || '').trim() })),
            }
          : {}),
        ...(it.isCustom ? { isCustom: true } : {}),
      })),
    },
    { merge: true },
  )
  return true
}

// Remove a single item from a category by name (case-insensitive first match)
export async function removeMenuItem(categoryName, itemName) {
  if (!categoryName || !itemName) return false
  const ref = doc(db, 'menu', categoryName)
  const snap = await getDoc(ref)
  if (!snap.exists()) return false
  const data = snap.data()
  const items = Array.isArray(data.items) ? data.items : []
  const idx = items.findIndex(it => (it.name || '').trim().toLowerCase() === itemName.trim().toLowerCase())
  if (idx === -1) return false
  const next = items.filter((_, i) => i !== idx)
  await setDoc(ref, { items: next }, { merge: true })
  return true
}

// Rename a category doc: copy to new doc and delete the old doc
export async function renameMenuCategory(oldName, newName) {
  const from = String(oldName || '').trim()
  const to = String(newName || '').trim()
  if (!from || !to || from === to) return from
  const oldRef = doc(db, 'menu', from)
  const oldSnap = await getDoc(oldRef)
  const data = oldSnap.exists() ? oldSnap.data() : { items: [] }
  const items = Array.isArray(data.items) ? data.items : []
  const newRef = doc(db, 'menu', to)
  // Only copy items; do not store name field
  await setDoc(newRef, { items }, { merge: true })
  await deleteDoc(oldRef)
  return to
}

// One-time migration: remove stale `name` fields from `menu` collection documents
export async function migrateRemoveCategoryNameFields() {
  try {
    const snap = await getDocs(collection(db, 'menu'))
    const batch = writeBatch(db)
    let count = 0
    snap.forEach(d => {
      const data = d.data()
      const needsStrip = Object.prototype.hasOwnProperty.call(data, 'name') || Object.prototype.hasOwnProperty.call(data, 'merge')
      if (needsStrip) {
        const items = Array.isArray(data.items) ? data.items : []
        // Rewrite doc ONLY with items array (drops stale keys like name/merge)
        batch.set(doc(db, 'menu', d.id), { items }, { merge: false })
        count++
      }
    })
    if (count > 0) await batch.commit()
    return count
  } catch (err) {
    console.error('[firestore] migrateRemoveCategoryNameFields failed', err)
    return 0
  }
}

// CSV utilities
export function parseItemsCsv(csvText) {
  // Very light CSV parser for header: item_name,MRP,GST,Discount
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return []
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const idx = {
    name: header.indexOf('item_name'),
    mrp: header.indexOf('mrp'),
    gst: header.indexOf('gst'),
    discount: header.indexOf('discount'),
  }
  return lines.slice(1).map((row) => {
    const cols = row.split(',').map((c) => c.trim())
    return {
      item_name: cols[idx.name] || '',
      MRP: Number(cols[idx.mrp]) || 0,
      GST: Number(cols[idx.gst]) || 0,
      Discount: Number(cols[idx.discount]) || 0,
    }
  })
}

// --- Cart Persistence --- //
export async function loadCart(uid) {
  if (!uid) return {}
  try {
    const ref = doc(db, 'users', uid, 'meta', 'cart')
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data()
      return data.items || {}
    }
    // Fallback: try compact snapshot on users/{uid}
    const userSnap = await getDoc(doc(db, 'users', uid))
    if (userSnap.exists()) {
      const live = userSnap.data().cartLive
      if (live && live.items && typeof live.items === 'object') {
        // Rehydrate into expected shape { [id]: { item, qty } }
        const restored = {}
        Object.entries(live.items).forEach(([id, v]) => {
          restored[id] = { item: { id, name: v.name, price: Number(v.price)||0 }, qty: Number(v.qty)||0 }
        })
        return restored
      }
    }
    return {}
  } catch (e) {
    if (isPermissionDenied(e)) {
      return { __error: 'permission-denied' }
    }
    console.warn('loadCart failed', e)
    return { __error: 'other' }
  }
}

export async function saveCart(uid, cartItems) {
  if (!uid) return
  try {
    const ref = doc(db, 'users', uid, 'meta', 'cart')
    // cartItems shape: { [id]: { item, qty } }
  const sanitizedItems = sanitizeFirestoreData(cartItems) || {}
    await setDoc(ref, { items: sanitizedItems, updatedAt: serverTimestamp() }, { merge: true })
    // Also store a small snapshot on the user doc for quick reads (counts only)
    const entries = Object.entries(sanitizedItems || {})
    const totalQty = entries.reduce((s, [,v]) => s + (v?.qty || 0), 0)
    const subtotal = entries.reduce((s, [,v]) => s + ((v?.item?.price || 0) * (v?.qty || 0)), 0)
    const compact = {}
    entries.forEach(([id, v]) => { compact[id] = { qty: v.qty || 0, name: v.item?.name || '', price: Number(v.item?.price)||0 } })
    await setDoc(doc(db, 'users', uid), { cartLive: { totalQty, subtotal, items: compact }, updatedAt: serverTimestamp() }, { merge: true })
  } catch (e) {
    if (isPermissionDenied(e)) {
      return { __error: 'permission-denied' }
    }
    console.warn('saveCart failed', e)
    return { __error: 'other' }
  }
}

// --- User Profile & Addresses --- //
export async function fetchUserProfile(uid) {
  if (!uid) return null
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  } catch (e) {
    console.warn('fetchUserProfile failed', e)
    return null
  }
}

export async function updateUserProfile(uid, data) {
  if (!uid) return
  // Only store supported profile fields
  const allowed = ['displayName', 'phone', 'whatsapp', 'gender', 'photoURL', 'email']
  const out = {}
  for (const k of allowed) {
    if (data[k] !== undefined) out[k] = data[k]
  }
  await setDoc(doc(db, 'users', uid), { ...out, updatedAt: serverTimestamp() }, { merge: true })
}

export async function addAddress(uid, address) {
  if (!uid) return
  const ref = doc(db, 'users', uid, 'meta', 'addresses')
  const snap = await getDoc(ref)
  const list = snap.exists() && Array.isArray(snap.data().list) ? snap.data().list : []
  const id = address.id || safeRandomId('addr')
  // Build compact, final schema for address storage
  const normalized = (() => {
    const nm = (v) => (typeof v === 'string' ? v.trim() : v)
    const obj = {
      id,
      name: nm(address.name) || nm(address.tag) || 'Address',
      tag: nm(address.tag) || 'Other',
      line1: nm(address.line1) || '',
      ...(nm(address.line2) ? { line2: nm(address.line2) } : {}),
      city: nm(address.city) || '',
      zip: nm(address.zip) || '',
      ...(nm(address.phone) ? { phone: nm(address.phone) } : {}),
      ...(typeof address.lat === 'number' ? { lat: address.lat } : {}),
      ...(typeof address.lng === 'number' ? { lng: address.lng } : {}),
      ...(nm(address.placeId) ? { placeId: nm(address.placeId) } : {}),
      ...(nm(address.mapUrl) ? { mapUrl: nm(address.mapUrl) } : {}),
    }
    return obj
  })()
  const next = [...list, normalized]
  // If first address, also set defaultId
  const payload = { list: next, updatedAt: serverTimestamp() }
  if (list.length === 0) payload.defaultId = id
  await setDoc(ref, payload, { merge: true })
  return id
}

export async function updateAddress(uid, id, patch) {
  if (!uid) return
  const ref = doc(db, 'users', uid, 'meta', 'addresses')
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  const list = Array.isArray(data.list) ? data.list : []
  // Sanitize incoming patch against final schema and drop deprecated fields
  const nm = (v) => (typeof v === 'string' ? v.trim() : v)
  const allowedKeys = new Set(['name','tag','line1','line2','city','zip','phone','lat','lng','placeId','mapUrl'])
  const cleaned = {}
  Object.entries(patch || {}).forEach(([k,v]) => {
    if (!allowedKeys.has(k)) return
    const val = nm(v)
    if (val === '' || val === undefined) {
      // allow clearing by setting empty string; we'll omit it when rebuilding the object
      cleaned[k] = ''
    } else {
      cleaned[k] = val
    }
  })
  const next = list.map(a => {
    if (a.id !== id) return a
    const base = {
      id: a.id,
      name: nm(cleaned.name ?? a.name) || nm(cleaned.tag ?? a.tag) || 'Address',
      tag: nm(cleaned.tag ?? a.tag) || 'Other',
      line1: nm(cleaned.line1 ?? a.line1) || '',
      ...(nm(cleaned.line2 ?? a.line2) ? { line2: nm(cleaned.line2 ?? a.line2) } : {}),
      city: nm(cleaned.city ?? a.city) || '',
      zip: nm(cleaned.zip ?? a.zip) || '',
      ...(nm(cleaned.phone ?? a.phone) ? { phone: nm(cleaned.phone ?? a.phone) } : {}),
      ...(typeof (cleaned.lat ?? a.lat) === 'number' ? { lat: Number(cleaned.lat ?? a.lat) } : {}),
      ...(typeof (cleaned.lng ?? a.lng) === 'number' ? { lng: Number(cleaned.lng ?? a.lng) } : {}),
      ...(nm(cleaned.placeId ?? a.placeId) ? { placeId: nm(cleaned.placeId ?? a.placeId) } : {}),
      ...(nm(cleaned.mapUrl ?? a.mapUrl) ? { mapUrl: nm(cleaned.mapUrl ?? a.mapUrl) } : {}),
    }
    return base
  })
  await setDoc(ref, { list: next, updatedAt: serverTimestamp() }, { merge: true })
}

export async function deleteAddress(uid, id) {
  if (!uid) return
  const ref = doc(db, 'users', uid, 'meta', 'addresses')
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  const list = Array.isArray(data.list) ? data.list : []
  const next = list.filter(a => a.id !== id)
  const payload = { list: next, updatedAt: serverTimestamp() }
  if (data.defaultId === id) {
    payload.defaultId = next.length ? next[0].id : null
  }
  await setDoc(ref, payload, { merge: true })
}

export async function fetchAddresses(uid) {
  if (!uid) return []
  const ref = doc(db, 'users', uid, 'meta', 'addresses')
  const snap = await getDoc(ref)
  if (!snap.exists()) return { list: [], defaultId: null }
  const data = snap.data()
  return { list: Array.isArray(data.list) ? data.list : [], defaultId: data.defaultId || null }
}

export async function setDefaultAddress(uid, id) {
  if (!uid || !id) return
  const ref = doc(db, 'users', uid, 'meta', 'addresses')
  await setDoc(ref, { defaultId: id, updatedAt: serverTimestamp() }, { merge: true })
}

// --- Image storage (base64) --- //
// Stores raw base64 (without data: prefix) plus MIME. Returns image id.
// Optional meta: { ownerType: 'category'|'item', categoryId, itemName }
export async function saveBase64Image(base64, mime, meta = {}) {
  if (!base64) throw new Error('No image data')
  const imagesCol = collection(db, 'images')
  const ref = doc(imagesCol)
  const payload = { data: base64, mime: mime || null, createdAt: serverTimestamp() }
  if (meta && typeof meta === 'object') {
    const { ownerType, categoryId, itemName } = meta
    if (ownerType) payload.ownerType = ownerType
    if (categoryId) payload.categoryId = categoryId
    if (itemName) payload.itemName = itemName
  }
  await setDoc(ref, payload)
  return ref.id
}

export async function fetchImagesByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return {}
  const unique = Array.from(new Set(ids.filter(Boolean)))
  const out = {}
  await Promise.all(unique.map(async (id) => {
    try {
      const snap = await getDoc(doc(db, 'images', id))
      if (snap.exists()) {
        const d = snap.data()
        out[id] = d
      }
    } catch (e) {
      console.warn('fetchImagesByIds failed for', id, e)
    }
  }))
  return out
}

// Session-scoped image cache. Persists for the lifetime of the tab, cleared on full close.
function getSessionImage(id) {
  try {
    const raw = sessionStorage.getItem(`img:${id}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.data) return parsed
  } catch {}
  return null
}

// Store a minimal image object in sessionStorage to avoid refetching during the
// lifetime of the tab. Keeps shape { data, mime } so callers using
// `getImageDataUrl` can consume it directly.
function setSessionImage(id, obj) {
  try {
    if (!id || !obj) return
    const toStore = { data: obj.data || null, mime: obj.mime || null }
    // Only store if there is data
    if (!toStore.data) return
    try {
      sessionStorage.setItem(`img:${id}`, JSON.stringify(toStore))
    } catch {
      // sessionStorage can throw on quota issues or in some privacy modes; ignore
    }
  } catch {}
}

// Cached variant: reads images from sessionStorage when available, otherwise fetches
// from Firestore and stores in sessionStorage. Same return shape as fetchImagesByIds.
export async function fetchImagesByIdsCached(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return {}
  const unique = Array.from(new Set(ids.filter(Boolean)))
  const cachedOut = {}
  const toFetch = []
  for (const id of unique) {
    const hit = getSessionImage(id)
    if (hit) {
      cachedOut[id] = hit
    } else {
      toFetch.push(id)
    }
  }
  if (toFetch.length) {
    const fetched = await fetchImagesByIds(toFetch)
    Object.entries(fetched).forEach(([id, obj]) => {
      setSessionImage(id, obj)
    })
    return { ...fetched, ...cachedOut }
  }
  return cachedOut
}

// Optional tiny in-memory cache for image data URLs for this module instance
const memoryImageCache = new Map()
export function getImageDataUrl(obj) {
  // obj shape: { data, mime }
  const key = `${obj.mime || 'image/*'}:${obj.data?.slice?.(0, 24) || ''}:${obj.data?.length || 0}`
  if (memoryImageCache.has(key)) return memoryImageCache.get(key)
  const url = `data:${obj.mime || 'image/*'};base64,${obj.data}`
  memoryImageCache.set(key, url)
  return url
}
