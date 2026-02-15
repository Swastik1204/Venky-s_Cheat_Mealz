// Image storage & caching functions
// NOTE: Image storage will migrate to Cloudinary in a future iteration.
// For now images are stored as base64 in Firestore.
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

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

export async function fetchImagesByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return {}
  const unique = Array.from(new Set(ids.filter(Boolean)))
  const out = {}
  await Promise.all(unique.map(async (id) => {
    try {
      const snap = await getDoc(doc(db, 'images', id))
      if (snap.exists()) {
        out[id] = snap.data()
      }
    } catch (e) {
      console.warn('fetchImagesByIds failed for', id, e)
    }
  }))
  return out
}

// Session-scoped image cache
function getSessionImage(id) {
  try {
    const raw = sessionStorage.getItem(`img:${id}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && (parsed.data || parsed.url)) return parsed
  } catch {}
  return null
}

function setSessionImage(id, obj) {
  try {
    if (!id || !obj) return
    if (obj.url) {
      const toStore = { url: obj.url, mime: obj.mime || null }
      try { sessionStorage.setItem(`img:${id}`, JSON.stringify(toStore)) } catch {}
      return
    }
    const toStore = { data: obj.data || null, mime: obj.mime || null }
    if (!toStore.data) return
    try {
      sessionStorage.setItem(`img:${id}`, JSON.stringify(toStore))
    } catch {
      // sessionStorage can throw on quota issues; ignore
    }
  } catch {}
}

// Cached variant: reads images from sessionStorage when available
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

// In-memory cache for image data URLs
const memoryImageCache = new Map()
const MAX_MEMORY_IMAGE_CACHE = 50

export function getImageDataUrl(obj) {
  if (!obj) return ''
  // Support URL-based images (Firebase Storage format)
  if (typeof obj === 'string') return obj
  if (typeof obj === 'object' && typeof obj.url === 'string' && obj.url.trim()) {
    return obj.url.trim()
  }
  // Legacy base64 images
  const data = (typeof obj === 'object' && typeof obj.data === 'string') ? obj.data.trim() : ''
  if (!data) return ''
  const mime = (typeof obj === 'object' && typeof obj.mime === 'string' && obj.mime.trim()) ? obj.mime.trim() : 'image/*'
  const key = `${mime}:${data.slice(0, 24)}:${data.length}`
  if (memoryImageCache.has(key)) return memoryImageCache.get(key)
  const url = `data:${mime};base64,${data}`

  if (memoryImageCache.size >= MAX_MEMORY_IMAGE_CACHE) {
    const firstKey = memoryImageCache.keys().next().value
    memoryImageCache.delete(firstKey)
  }

  memoryImageCache.set(key, url)
  return url
}
