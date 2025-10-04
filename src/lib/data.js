// Data layer for Firestore
import { collection, doc, getDocs, getDoc, query, where, addDoc, setDoc, serverTimestamp, orderBy, deleteDoc, arrayUnion, writeBatch } from 'firebase/firestore'
import { db } from './firebase'

function isPermissionDenied(err) {
  return err && (err.code === 'permission-denied' || /insufficient permissions/i.test(String(err.message || '')))
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

export async function createOrder({ userId = null, customer = {}, items }) {
  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0)
  const base = {
    userId: userId || null,
    customer,
    items,
    subtotal,
    status: 'placed',
    payment: customer.payment || { method: 'cod', status: 'pending' },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  if (userId) {
    // Generate a shared ID for top-level and nested doc
    const ordersTopCol = collection(db, 'orders')
    const topRef = doc(ordersTopCol) // create a new doc reference with random id
    const orderId = topRef.id
    await setDoc(topRef, base)
    const nestedRef = doc(db, 'users', userId, 'orders', orderId)
    await setDoc(nestedRef, base)
    return orderId
  }
  const docRef = await addDoc(collection(db, 'orders'), base)
  return docRef.id
}

// Update order status/payment (supports both nested and legacy top-level orders)
export async function updateOrder(userId, orderId, data) {
  const patch = { ...data, updatedAt: serverTimestamp() }
  // Update top-level
  await setDoc(doc(db, 'orders', orderId), patch, { merge: true })
  if (userId) {
    await setDoc(doc(db, 'users', userId, 'orders', orderId), patch, { merge: true })
  }
}

// Fetch single order
export async function fetchOrder(userId, orderId) {
  const ref = userId ? doc(db, 'users', userId, 'orders', orderId) : doc(db, 'orders', orderId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Fetch all top-level orders (admin view)
export async function fetchAllOrders() {
  try {
    const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('[firestore] fetchAllOrders failed', err)
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
    // Fallback to legacy top-level
    const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc')))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
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
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    if (isPermissionDenied(err)) {
      console.warn('[firestore] Public read denied for menu. Update rules to allow read.', err)
      return []
    }
    console.error('[firestore] fetchMenuCategories failed:', err)
    return []
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
    const item = { name: it.name, price: Number(it.price) || 0, veg: it.veg === false ? false : true }
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
    toAdd.push({ name, price: Number(r.price) || 0, veg: r.veg === false ? false : true })
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
        price: Number(it.price) || 0,
        veg: it.veg === false ? false : true,
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

export async function bulkImportItemsFromCsv(csvText) {
  const items = parseItemsCsv(csvText)
  const promises = items.map((it) => addItem(it))
  await Promise.all(promises)
  return items.length
}
