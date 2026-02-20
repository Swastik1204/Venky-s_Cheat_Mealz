// Image storage, caching, and deletion (admin)
// NOTE: Image storage will migrate to Cloudinary in a future iteration.
// For now images are stored as base64 in Firestore.
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, deleteField, collection } from 'firebase/firestore'
import { db } from './firebase'

// ── Upload / Save ──
export async function saveBase64Image(base64, mime, meta = {}) {
  if (!base64) throw new Error('No image data')
  const imagesCol = collection(db, 'images')
  const docRef = doc(imagesCol)
  const id = docRef.id
  const mimeType = mime || 'image/jpeg'

  const payload = { data: base64, mime: mimeType, createdAt: serverTimestamp() }
  if (meta && typeof meta === 'object') {
    const { ownerType, categoryId, itemName } = meta
    if (ownerType) payload.ownerType = ownerType
    if (categoryId) payload.categoryId = categoryId
    if (itemName) payload.itemName = itemName
  }
  await setDoc(docRef, payload)
  return id
}

// ── Fetch ──
export async function fetchImagesByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return {}
  const unique = Array.from(new Set(ids.filter(Boolean)))
  const out = {}
  await Promise.all(unique.map(async (id) => {
    try {
      const snap = await getDoc(doc(db, 'images', id))
      if (snap.exists()) out[id] = snap.data()
    } catch (e) {
      console.warn('fetchImagesByIds failed for', id, e)
    }
  }))
  return out
}

// ── In-memory LRU cache (DO NOT persist to localStorage/sessionStorage) ──
// Storing large base64 blobs in browser storage easily exceeds quotas and breaks the biller UI.

function purgeLegacyStorageImageCache() {
  try {
    if (typeof window === 'undefined') return
    const stores = [window.localStorage, window.sessionStorage].filter(Boolean)
    stores.forEach((store) => {
      try {
        const toRemove = []
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i)
          if (k && k.startsWith('img:')) toRemove.push(k)
        }
        toRemove.forEach((k) => {
          try { store.removeItem(k) } catch { /* ignore */ }
        })
      } catch { /* ignore */ }
    })
  } catch { /* ignore */ }
}

// Purge once on module load
purgeLegacyStorageImageCache()

const __imageObjectCache = new Map()   // id → { data, mime } | { url }
const __imageObjectCacheOrder = []
const __MAX_IMAGE_OBJECT_CACHE = 100

function getCachedImageObject(id) {
  return __imageObjectCache.get(id) || null
}

function setCachedImageObject(id, obj) {
  if (!id || !obj) return
  __imageObjectCache.set(id, obj)
  __imageObjectCacheOrder.push(id)
  while (__imageObjectCacheOrder.length > __MAX_IMAGE_OBJECT_CACHE) {
    const oldest = __imageObjectCacheOrder.shift()
    if (oldest) __imageObjectCache.delete(oldest)
  }
}

export async function fetchImagesByIdsCached(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return {}
  const unique = Array.from(new Set(ids.filter(Boolean)))
  const cachedOut = {}
  const toFetch = []
  for (const id of unique) {
    const hit = getCachedImageObject(id)
    if (hit) cachedOut[id] = hit
    else toFetch.push(id)
  }
  if (!toFetch.length) return cachedOut
  const fetched = await fetchImagesByIds(toFetch)
  Object.entries(fetched).forEach(([id, obj]) => setCachedImageObject(id, obj))
  return { ...fetched, ...cachedOut }
}

// ── Data-URL helper ──
const memoryImageCache = new Map()

export function getImageDataUrl(obj) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  if (typeof obj === 'object' && typeof obj.url === 'string' && obj.url.trim()) {
    return obj.url.trim()
  }
  const data = (typeof obj === 'object' && typeof obj.data === 'string') ? obj.data.trim() : ''
  if (!data) return ''
  const mime = (typeof obj === 'object' && typeof obj.mime === 'string' && obj.mime.trim()) ? obj.mime.trim() : 'image/*'
  const key = `${mime}:${data.slice(0, 24)}:${data.length}`
  if (memoryImageCache.has(key)) return memoryImageCache.get(key)
  const url = `data:${mime};base64,${data}`
  memoryImageCache.set(key, url)
  return url
}

// ── Delete ──
export async function deleteImageById(imageId) {
  if (!imageId) return false
  try {
    await deleteDoc(doc(db, 'images', imageId))
    return true
  } catch (e) {
    console.warn('deleteImageById failed', imageId, e)
    return false
  }
}

// Remove a category's imageId field and delete the backing image document
export async function removeCategoryImage(categoryId) {
  if (!categoryId) return { ok: false }
  try {
    const ref = doc(db, 'menu', categoryId)
    const snap = await getDoc(ref)
    const existing = snap.exists() ? snap.data() : {}
    const imageId = existing.imageId || null
    await setDoc(ref, { imageId: deleteField(), updatedAt: serverTimestamp() }, { merge: true })
    if (imageId) await deleteImageById(imageId)
    return { ok: true, deletedImageId: imageId }
  } catch (e) {
    console.error('removeCategoryImage failed', e)
    return { ok: false, error: String(e?.message || e) }
  }
}
