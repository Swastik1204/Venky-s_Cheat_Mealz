// Menu-related data functions (admin) — includes legacy menuItems/categories
import { collection, doc, getDocs, getDoc, query, where, setDoc, serverTimestamp, deleteDoc, arrayUnion, writeBatch } from 'firebase/firestore'
import { auth, db } from './firebase'
import { toMoney, toDiscount, normalizeTextKey, dedupeByTextKey } from './data-common'
import { recordChange } from './data-changeHistory'

function resolveActor(performedBy) {
  return String(performedBy || auth.currentUser?.email || auth.currentUser?.uid || 'system')
}

async function safeRecordChange(payload) {
  try {
    await recordChange(payload)
  } catch (err) {
    console.error('[changeHistory] menu record failed', err)
  }
}

function normalizeAvailability(item) {
  return item?.active === false ? 'unavailable' : 'available'
}

function extractRate(item) {
  const value = Number(item?.rate ?? item?.price ?? 0)
  return Number.isFinite(value) ? Math.round(value) : 0
}

function getMenuDiffDescription(beforeItems = [], afterItems = []) {
  const beforeMap = new Map(beforeItems.map((it) => [normalizeTextKey(it?.name), it]))
  const afterMap = new Map(afterItems.map((it) => [normalizeTextKey(it?.name), it]))

  for (const [key, afterItem] of afterMap.entries()) {
    const beforeItem = beforeMap.get(key)
    const name = String(afterItem?.name || '').trim()
    if (!beforeItem && name) return `New item '${name}' added to menu`
    if (!beforeItem) continue

    const oldRate = extractRate(beforeItem)
    const newRate = extractRate(afterItem)
    if (oldRate !== newRate && name) {
      return `Menu item '${name}' price changed from ₹${oldRate} to ₹${newRate}`
    }

    const oldState = normalizeAvailability(beforeItem)
    const newState = normalizeAvailability(afterItem)
    if (oldState !== newState && name) {
      return `'${name}' marked as ${newState}`
    }
  }

  for (const [key, beforeItem] of beforeMap.entries()) {
    if (!afterMap.has(key)) {
      const name = String(beforeItem?.name || '').trim() || 'Item'
      return `Menu item '${name}' deleted`
    }
  }

  return 'Menu updated'
}

async function assertUniqueCategoryName(name, ignoreId = null) {
  const key = normalizeTextKey(name)
  if (!key) throw new Error('Category name is required')
  const ignoreKey = ignoreId ? normalizeTextKey(ignoreId) : null
  const snap = await getDocs(collection(db, 'menu'))
  const found = snap.docs.find(d => {
    if (ignoreKey && normalizeTextKey(d.id) === ignoreKey) return false
    return normalizeTextKey(d.id) === key
  })
  if (found) throw new Error('Category with this name already exists')
}

export async function fetchMenuCategories() {
  try {
    const snap = await getDocs(collection(db, 'menu'))
    let cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
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
    } catch { /* ignore categories appearance ordering */ }
    return cats
  } catch (err) {
    console.error('[firestore] fetchMenuCategories failed:', err)
    return []
  }
}

export async function upsertMenuCategory(name) {
  const normalizedName = String(name || '').trim()
  const ref = doc(db, 'menu', normalizedName)
  const beforeSnap = await getDoc(ref)
  if (!beforeSnap.exists()) {
    await assertUniqueCategoryName(normalizedName)
  }
  await setDoc(ref, {}, { merge: true })

  const afterSnap = await getDoc(ref)
  await safeRecordChange({
    collection: 'menu',
    docId: normalizedName,
    before: beforeSnap.exists() ? beforeSnap.data() : null,
    after: afterSnap.exists() ? afterSnap.data() : null,
    action: beforeSnap.exists() ? 'update' : 'create',
    performedBy: resolveActor(),
    description: beforeSnap.exists()
      ? `Menu category '${normalizedName}' updated`
      : `Menu category '${normalizedName}' created`,
  })

  return normalizedName
}

export async function appendMenuItems(categoryName, items, performedBy = null) {
  const ref = doc(db, 'menu', categoryName)
  const normalizedCategory = String(categoryName || '').trim()
  if (!normalizedCategory) throw new Error('Category name is required')

  const beforeSnap = await getDoc(ref)
  const beforeData = beforeSnap.exists() ? beforeSnap.data() : null
  const beforeItems = Array.isArray(beforeData?.items) ? beforeData.items : []

  await setDoc(ref, {}, { merge: true })
  const snap = await getDoc(ref)
  const existingItems = snap.exists() && Array.isArray(snap.data().items) ? snap.data().items : []
  const existingNames = new Set(existingItems.map(i => normalizeTextKey(i?.name)))
  const uniqueItems = dedupeByTextKey(items, it => it?.name)
  for (const it of uniqueItems) {
    const normalizedName = String(it?.name || '').trim()
    const nameKey = normalizeTextKey(normalizedName)
    if (!nameKey || existingNames.has(nameKey)) continue
    existingNames.add(nameKey)
    const rate = toMoney(it.rate ?? it.price)
    const mrp = toMoney(it.mrp ?? it.MRP)
    const discountSource = it.discountPercent ?? it.discount
    const derivedDiscount = mrp !== null && rate !== null && mrp > 0 ? ((mrp - rate) / mrp) * 100 : null
    const discount = toDiscount(discountSource ?? derivedDiscount)
    const item = { name: normalizedName, veg: it.veg === false ? false : true }
    if (rate !== null) item.rate = rate
    if (mrp !== null) item.mrp = mrp
    if (discount !== null) item.discountPercent = discount
    if (it.active === false) item.active = false
    if (it.imageId) item.imageId = it.imageId
    if (it.needsReview) item.needsReview = true
    await setDoc(ref, { items: arrayUnion(item) }, { merge: true })
  }

  const afterSnap = await getDoc(ref)
  const afterData = afterSnap.exists() ? afterSnap.data() : null
  const afterItems = Array.isArray(afterData?.items) ? afterData.items : []
  await safeRecordChange({
    collection: 'menu',
    docId: normalizedCategory,
    before: beforeData,
    after: afterData,
    action: beforeSnap.exists() ? 'update' : 'create',
    performedBy: resolveActor(performedBy),
    description: getMenuDiffDescription(beforeItems, afterItems),
  })

  return true
}

export async function addMenuItems(categoryName, rawItems, performedBy = null) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return { added: 0, skipped: 0 }
  const ref = doc(db, 'menu', categoryName)
  const snap = await getDoc(ref)
  const existing = snap.exists() && Array.isArray(snap.data().items) ? snap.data().items : []
  const existingNames = new Set(existing.map(i => normalizeTextKey(i.name)))
  const toAdd = []
  let skipped = 0
  for (const r of rawItems) {
    const name = (r.name || '').trim()
    if (!name) { skipped++; continue }
    const key = normalizeTextKey(name)
    if (existingNames.has(key)) { skipped++; continue }
    existingNames.add(key)
    const rate = toMoney(r.rate ?? r.price)
    const mrp = toMoney(r.mrp ?? r.MRP)
    const derivedDiscount = mrp !== null && rate !== null && mrp > 0 ? ((mrp - rate) / mrp) * 100 : null
    const discount = toDiscount(r.discountPercent ?? derivedDiscount)
    const item = { name, veg: r.veg === false ? false : true }
    if (rate !== null) item.rate = rate
    if (mrp !== null) item.mrp = mrp
    if (r.needsReview) item.needsReview = true
    if (discount !== null) item.discountPercent = discount
    toAdd.push(item)
  }
  if (toAdd.length) {
    await appendMenuItems(categoryName, toAdd, performedBy)
  } else {
    if (!snap.exists()) {
      await setDoc(ref, {}, { merge: true })
      const afterSnap = await getDoc(ref)
      await safeRecordChange({
        collection: 'menu',
        docId: String(categoryName || '').trim(),
        before: null,
        after: afterSnap.exists() ? afterSnap.data() : null,
        action: 'create',
        performedBy: resolveActor(performedBy),
        description: `Menu category '${String(categoryName || '').trim()}' created`,
      })
    }
  }
  return { added: toAdd.length, skipped }
}

export async function setMenuItems(categoryName, items, performedBy = null) {
  const ref = doc(db, 'menu', categoryName)
  const beforeSnap = await getDoc(ref)
  const beforeData = beforeSnap.exists() ? beforeSnap.data() : null
  const beforeItems = Array.isArray(beforeData?.items) ? beforeData.items : []
  const uniqueItems = dedupeByTextKey(items, it => it?.name)

  await setDoc(
    ref,
    {
      items: uniqueItems.map((it) => ({
        name: it.name,
        ...(() => {
          const rate = toMoney(it.rate ?? it.price)
          const mrp = toMoney(it.mrp ?? it.MRP)
          const derivedDiscount = mrp !== null && rate !== null && mrp > 0 ? ((mrp - rate) / mrp) * 100 : null
          const discount = toDiscount(it.discountPercent ?? derivedDiscount)
          const base = {}
          if (rate !== null) base.rate = rate
          if (mrp !== null) base.mrp = mrp
          if (discount !== null) base.discountPercent = discount
          return base
        })(),
        veg: it.veg === false ? false : true,
        ...(it.active === false ? { active: false } : {}),
        ...(it.imageId ? { imageId: it.imageId } : {}),
        ...(it.needsReview ? { needsReview: true } : {}),
        ...(Array.isArray(it.components) && it.components.length
          ? {
              components: it.components
                .filter((r) => r && (String(r.text || '').trim() || String(r.qty || '').trim() || String(r.unit || '').trim()))
                .map((r) => ({ qty: String(r.qty || '').trim(), unit: String(r.unit || '').trim(), text: String(r.text || '').trim() })),
            }
          : {}),
        ...(it.isCustom ? { isCustom: true } : {}),
        ...(Array.isArray(it.variants) && it.variants.length
          ? {
              variants: it.variants.map(v => ({
                name: String(v.name || '').trim(),
                ...(Array.isArray(v.sizes)
                  ? {
                    sizes: v.sizes.map(s => ({
                      name: String(s.name || '').trim(),
                      rate: Math.round(Number(s.rate) || Number(s.price) || 0),
                      mrp: s.mrp != null ? Math.round(Number(s.mrp)) || null : null,
                      discountPercent: s.discountPercent != null ? Math.round(Number(s.discountPercent)) || null : null,
                    })),
                  }
                  : {}),
              }))
            }
          : {}),
      })),
    },
    { merge: true },
  )

  const afterSnap = await getDoc(ref)
  const afterData = afterSnap.exists() ? afterSnap.data() : null
  const afterItems = Array.isArray(afterData?.items) ? afterData.items : []
  await safeRecordChange({
    collection: 'menu',
    docId: String(categoryName || '').trim(),
    before: beforeData,
    after: afterData,
    action: beforeSnap.exists() ? 'update' : 'create',
    performedBy: resolveActor(performedBy),
    description: getMenuDiffDescription(beforeItems, afterItems),
  })

  return true
}

export async function removeMenuItem(categoryName, itemName, performedBy = null) {
  if (!categoryName || !itemName) return false
  const ref = doc(db, 'menu', categoryName)
  const beforeSnap = await getDoc(ref)
  if (!beforeSnap.exists()) return false
  const data = beforeSnap.data()
  const items = Array.isArray(data.items) ? data.items : []
  const idx = items.findIndex(it => (it.name || '').trim().toLowerCase() === itemName.trim().toLowerCase())
  if (idx === -1) return false
  const removedName = String(items[idx]?.name || itemName).trim() || String(itemName || '').trim() || 'Item'
  const next = items.filter((_, i) => i !== idx)
  await setDoc(ref, { items: next }, { merge: true })

  const afterSnap = await getDoc(ref)
  await safeRecordChange({
    collection: 'menu',
    docId: String(categoryName || '').trim(),
    before: beforeSnap.data(),
    after: afterSnap.exists() ? afterSnap.data() : null,
    action: 'delete',
    performedBy: resolveActor(performedBy),
    description: `Menu item '${removedName}' deleted`,
  })

  return true
}

export async function renameMenuCategory(oldName, newName, performedBy = null) {
  const from = String(oldName || '').trim()
  const to = String(newName || '').trim()
  if (!from || !to || from === to) return from
  await assertUniqueCategoryName(to, from)
  const oldRef = doc(db, 'menu', from)
  const oldSnap = await getDoc(oldRef)
  const oldBefore = oldSnap.exists() ? oldSnap.data() : null

  const data = oldSnap.exists() ? oldSnap.data() : { items: [] }
  const items = Array.isArray(data.items) ? data.items : []
  const newRef = doc(db, 'menu', to)

  const newBeforeSnap = await getDoc(newRef)
  const newBefore = newBeforeSnap.exists() ? newBeforeSnap.data() : null

  await setDoc(newRef, { items }, { merge: true })
  await deleteDoc(oldRef)

  const newAfterSnap = await getDoc(newRef)
  await safeRecordChange({
    collection: 'menu',
    docId: to,
    before: newBefore,
    after: newAfterSnap.exists() ? newAfterSnap.data() : null,
    action: newBeforeSnap.exists() ? 'update' : 'create',
    performedBy: resolveActor(performedBy),
    description: `Menu category renamed from '${from}' to '${to}'`,
  })

  await safeRecordChange({
    collection: 'menu',
    docId: from,
    before: oldBefore,
    after: null,
    action: 'delete',
    performedBy: resolveActor(performedBy),
    description: `Menu category '${from}' deleted`,
  })

  return to
}

export async function migrateRemoveCategoryNameFields() {
  try {
    const beforeSnap = await getDocs(collection(db, 'menu'))
    const beforeData = beforeSnap.docs.reduce((acc, d) => {
      acc[d.id] = d.data()
      return acc
    }, {})

    const snap = await getDocs(collection(db, 'menu'))
    const batch = writeBatch(db)
    let count = 0
    snap.forEach(d => {
      const data = d.data()
      const needsStrip = Object.prototype.hasOwnProperty.call(data, 'name') || Object.prototype.hasOwnProperty.call(data, 'merge')
      if (needsStrip) {
        const items = Array.isArray(data.items) ? data.items : []
        batch.set(doc(db, 'menu', d.id), { items }, { merge: false })
        count++
      }
    })
    if (count > 0) await batch.commit()

    if (count > 0) {
      const afterSnap = await getDocs(collection(db, 'menu'))
      const afterData = afterSnap.docs.reduce((acc, d) => {
        acc[d.id] = d.data()
        return acc
      }, {})
      await safeRecordChange({
        collection: 'menu',
        docId: '__batch_migration__',
        before: beforeData,
        after: afterData,
        action: 'update',
        performedBy: resolveActor(),
        description: `Menu migration removed legacy fields in ${count} categories`,
      })
    }

    return count
  } catch (err) {
    console.error('[firestore] migrateRemoveCategoryNameFields failed', err)
    return 0
  }
}

// ── Legacy menu item / category CRUD (menuItems & categories collections) ──
export async function fetchMenuItems(activeOnly = true) {
  try {
    const col = collection(db, 'menuItems')
    const q = activeOnly ? query(col, where('active', '==', true)) : col
    let snap = await getDocs(q)
    if (activeOnly && snap.empty) {
      snap = await getDocs(col)
    }
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('[firestore] fetchMenuItems failed:', err)
    return []
  }
}

export async function fetchItems() {
  try {
    const snap = await getDocs(collection(db, 'items'))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('[firestore] fetchItems failed:', err)
    return []
  }
}

export async function addItem(item) {
  const { addDoc } = await import('firebase/firestore')
  const normalizedName = String(item?.item_name || '').trim()
  if (!normalizedName) throw new Error('Item name is required')
  const existing = await getDocs(collection(db, 'items'))
  const alreadyExists = existing.docs.some(d => normalizeTextKey(d.data()?.item_name) === normalizeTextKey(normalizedName))
  if (alreadyExists) throw new Error('Item with this name already exists')

  const addedRef = await addDoc(collection(db, 'items'), {
    item_name: normalizedName,
    MRP: Number(item.MRP) || 0,
    GST: Number(item.GST) || 0,
    Discount: Number(item.Discount) || 0,
    createdAt: serverTimestamp(),
  })

  const afterSnap = await getDoc(addedRef)
  await safeRecordChange({
    collection: 'items',
    docId: addedRef.id,
    before: null,
    after: afterSnap.exists() ? afterSnap.data() : null,
    action: 'create',
    performedBy: resolveActor(),
    description: `Item '${normalizedName}' created`,
  })

  return addedRef
}

export async function upsertCategory(id, data) {
  const ref = doc(db, 'categories', id)
  const beforeSnap = await getDoc(ref)
  await setDoc(ref, { name: data.name, updatedAt: serverTimestamp() }, { merge: true })

  const afterSnap = await getDoc(ref)
  await safeRecordChange({
    collection: 'categories',
    docId: String(id || '').trim(),
    before: beforeSnap.exists() ? beforeSnap.data() : null,
    after: afterSnap.exists() ? afterSnap.data() : null,
    action: beforeSnap.exists() ? 'update' : 'create',
    performedBy: resolveActor(),
    description: beforeSnap.exists()
      ? `Category '${String(data?.name || id || '').trim()}' updated`
      : `Category '${String(data?.name || id || '').trim()}' created`,
  })

  return id
}

export async function upsertMenuItem(id, data) {
  const ref = doc(db, 'menuItems', id)
  const beforeSnap = await getDoc(ref)
  const beforeData = beforeSnap.exists() ? beforeSnap.data() : null

  await setDoc(
    ref,
    {
      name: data.name,
      rate: Number(data.rate ?? data.price) || 0,
      categoryId: data.categoryId,
      active: data.active ?? true,
      desc: data.desc ?? '',
      image: data.image ?? '',
      updatedAt: serverTimestamp(),
      createdAt: data.createdAt || serverTimestamp(),
    },
    { merge: true }
  )

  const afterSnap = await getDoc(ref)
  const afterData = afterSnap.exists() ? afterSnap.data() : null
  const oldRate = extractRate(beforeData)
  const newRate = extractRate(afterData)
  const oldState = normalizeAvailability(beforeData)
  const newState = normalizeAvailability(afterData)

  let description = beforeSnap.exists()
    ? `Menu item '${String(data?.name || id || '').trim()}' updated`
    : `New item '${String(data?.name || id || '').trim()}' added to menu`
  if (beforeSnap.exists() && oldRate !== newRate) {
    description = `Menu item '${String(data?.name || id || '').trim()}' price changed from ₹${oldRate} to ₹${newRate}`
  } else if (beforeSnap.exists() && oldState !== newState) {
    description = `'${String(data?.name || id || '').trim()}' marked as ${newState}`
  }

  await safeRecordChange({
    collection: 'menuItems',
    docId: String(id || '').trim(),
    before: beforeData,
    after: afterData,
    action: beforeSnap.exists() ? 'update' : 'create',
    performedBy: resolveActor(),
    description,
  })

  return id
}

export async function deleteMenuItem_legacy(id) {
  const ref = doc(db, 'menuItems', id)
  const beforeSnap = await getDoc(ref)
  const beforeData = beforeSnap.exists() ? beforeSnap.data() : null
  const itemName = String(beforeData?.name || id || '').trim() || 'Item'
  await deleteDoc(ref)
  await safeRecordChange({
    collection: 'menuItems',
    docId: String(id || '').trim(),
    before: beforeData,
    after: null,
    action: 'delete',
    performedBy: resolveActor(),
    description: `Menu item '${itemName}' deleted`,
  })
}
