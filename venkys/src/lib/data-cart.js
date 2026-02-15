// Cart persistence functions
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { isPermissionDenied, sanitizeFirestoreData } from './data-common'

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
        const restored = {}
        Object.entries(live.items).forEach(([id, v]) => {
          restored[id] = { item: { id, name: v.name, rate: Number(v.rate ?? v.price) || 0 }, qty: Number(v.qty) || 0 }
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
    const minimalItems = {}
    Object.entries(cartItems || {}).forEach(([id, entry]) => {
      if (entry && entry.item && entry.qty > 0) {
        minimalItems[id] = {
          item: {
            id: entry.item.id,
            name: entry.item.name,
            rate:
              typeof entry.item.rate === 'number'
                ? entry.item.rate
                : Number(entry.item.rate ?? entry.item.price) || 0,
          },
          qty: entry.qty,
        }
      }
    })
    const sanitizedItems = sanitizeFirestoreData(minimalItems) || {}
    await setDoc(ref, { items: sanitizedItems, updatedAt: serverTimestamp() }, { merge: true })
  } catch (e) {
    if (isPermissionDenied(e)) {
      return { __error: 'permission-denied' }
    }
    console.warn('saveCart failed', e)
    return { __error: 'other' }
  }
}
