// Menu-related data functions
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, arrayUnion } from 'firebase/firestore'
import { db } from './firebase'
import { toMoney, toDiscount, isPermissionDenied, normalizeTextKey, dedupeByTextKey } from './data-common'

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

export async function upsertMenuCategory(name) {
  const normalizedName = String(name || '').trim()
  const ref = doc(db, 'menu', normalizedName)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await assertUniqueCategoryName(normalizedName)
  }
  await setDoc(ref, {}, { merge: true })
  return normalizedName
}

export async function appendMenuItems(categoryName, items) {
  const ref = doc(db, 'menu', categoryName)
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
    const derivedDiscount = mrp !== null && rate !== null && mrp > 0 ? ((mrp - rate) / mrp) * 100 : null
    const discount = toDiscount(it.discountPercent ?? derivedDiscount)
    const item = { name: normalizedName, veg: it.veg === false ? false : true }
    if (rate !== null) item.rate = rate
    if (mrp !== null) item.mrp = mrp
    if (discount !== null) item.discountPercent = discount
    if (it.active === false) item.active = false
    if (it.imageId) item.imageId = it.imageId
    await setDoc(ref, { items: arrayUnion(item) }, { merge: true })
  }
  return true
}

export async function addMenuItems(categoryName, rawItems) {
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
    if (discount !== null) item.discountPercent = discount
    toAdd.push(item)
  }
  if (toAdd.length) {
    await appendMenuItems(categoryName, toAdd)
  } else {
    if (!snap.exists()) await setDoc(ref, {}, { merge: true })
  }
  return { added: toAdd.length, skipped }
}

export async function setMenuItems(categoryName, items) {
  const ref = doc(db, 'menu', categoryName)
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
                      }))
                    }
                  : {})
              }))
            }
          : {}),
      })),
    },
    { merge: true },
  )
  return true
}

export async function removeMenuItem(categoryName, itemName) {
  if (!categoryName || !itemName) return false
  const ref = doc(db, 'menu', categoryName)
  const snap = await getDoc(ref)
  if (!snap.exists()) return false
  const data = snap.data()
  const items = Array.isArray(data.items) ? data.items : []
  const idx = items.findIndex(it => normalizeTextKey(it.name) === normalizeTextKey(itemName))
  if (idx === -1) return false
  const next = items.filter((_, i) => i !== idx)
  await setDoc(ref, { items: next }, { merge: true })
  return true
}

export async function renameMenuCategory(oldName, newName) {
  const from = String(oldName || '').trim()
  const to = String(newName || '').trim()
  if (!from || !to || from === to) return from
  await assertUniqueCategoryName(to, from)
  const oldRef = doc(db, 'menu', from)
  const oldSnap = await getDoc(oldRef)
  const data = oldSnap.exists() ? oldSnap.data() : { items: [] }
  const items = Array.isArray(data.items) ? data.items : []
  const newRef = doc(db, 'menu', to)
  await setDoc(newRef, { items }, { merge: true })
  await deleteDoc(oldRef)
  return to
}
