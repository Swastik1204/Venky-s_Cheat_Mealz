// Data layer for Firestore
import { collection, doc, getDocs, getDoc, query, where, addDoc, setDoc, serverTimestamp, orderBy, deleteDoc, arrayUnion } from 'firebase/firestore'
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
  if (userId) {
    // Preferred: nested under users/{uid}/orders/{orderId}
    const ordersCol = collection(db, 'users', userId, 'orders')
    const ref = await addDoc(ordersCol, {
      customer,
      items,
      subtotal,
      status: 'placed',
      createdAt: serverTimestamp(),
    })
    return ref.id
  } else {
    // Legacy top-level orders
    const docRef = await addDoc(collection(db, 'orders'), {
      userId,
      customer,
      items,
      subtotal,
      status: 'placed',
      createdAt: serverTimestamp(),
    })
    return docRef.id
  }
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
  // No timestamps – minimal schema
  await setDoc(ref, { name }, { merge: true })
  return name
}

export async function appendMenuItems(categoryName, items) {
  const ref = doc(db, 'menu', categoryName)
  // Ensure the category document exists (creates the collection implicitly if missing)
  await setDoc(ref, { name: categoryName, items: [] }, { merge: true })
  for (const it of items) {
    const item = { name: it.name, price: Number(it.price) || 0 }
    await setDoc(ref, { items: arrayUnion(item) }, { merge: true })
  }
  return true
}

// Replace the whole items array for a category (used for inline edits)
export async function setMenuItems(categoryName, items) {
  const ref = doc(db, 'menu', categoryName)
  await setDoc(ref, { items: items.map((it) => ({ name: it.name, price: Number(it.price) || 0 })) }, { merge: true })
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
  await setDoc(newRef, { name: to, items }, { merge: true })
  await deleteDoc(oldRef)
  return to
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
