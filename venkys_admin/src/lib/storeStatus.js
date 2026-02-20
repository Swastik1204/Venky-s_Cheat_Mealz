// Store open/closed status (admin)
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const SETTINGS_REF = doc(db, 'miscellaneous', 'settings')
const LEGACY_REF = doc(db, 'miscellaneous', 'store')

export async function fetchStoreStatus() {
  try {
    const snap = await getDoc(SETTINGS_REF)
    if (snap.exists()) {
      const data = snap.data() || {}
      if (Object.prototype.hasOwnProperty.call(data, 'open')) {
        return { open: data.open !== false, updatedAt: data.updatedAt || null }
      }
    }
    try {
      const legacySnap = await getDoc(LEGACY_REF)
      if (legacySnap.exists()) {
        const legacyData = legacySnap.data() || {}
        const open = legacyData.open !== false
        await setDoc(SETTINGS_REF, { open, updatedAt: serverTimestamp() }, { merge: true })
        return { open, __migrated: true }
      }
    } catch {/* ignore legacy read issues */}
    return { open: true }
  } catch (err) {
    console.warn('[storeStatus] fetch failed', err)
    return { open: true, __error: true }
  }
}

export async function setStoreOpen(open, meta = {}) {
  const payload = { open: !!open, updatedAt: serverTimestamp() }
  if (meta.note) payload.note = String(meta.note)
  if (meta.updatedBy) payload.updatedBy = meta.updatedBy
  await setDoc(SETTINGS_REF, payload, { merge: true })
  try {
    await setDoc(LEGACY_REF, { open: !!open, updatedAt: serverTimestamp() }, { merge: true })
  } catch {/* legacy sync best-effort */}
  return true
}
