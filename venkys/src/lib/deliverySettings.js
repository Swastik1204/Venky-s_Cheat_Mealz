import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export async function fetchDeliverySettings() {
  try {
    const ref = doc(db, 'miscellaneous', 'settings')
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      return { centerLat: null, centerLng: null, radiusKm: null, __exists: false }
    }
    const d = snap.data()
    const centerLat = typeof d.centerLat === 'number' ? d.centerLat : (
      (typeof d.minLat === 'number' && typeof d.maxLat === 'number') ? ((d.minLat + d.maxLat) / 2) : null
    )
    const centerLng = typeof d.centerLng === 'number' ? d.centerLng : (
      (typeof d.minLng === 'number' && typeof d.maxLng === 'number') ? ((d.minLng + d.maxLng) / 2) : null
    )
    return {
      centerLat,
      centerLng,
      radiusKm: typeof d.radiusKm === 'number' ? d.radiusKm : null,
      minLat: typeof d.minLat === 'number' ? d.minLat : null,
      maxLat: typeof d.maxLat === 'number' ? d.maxLat : null,
      minLng: typeof d.minLng === 'number' ? d.minLng : null,
      maxLng: typeof d.maxLng === 'number' ? d.maxLng : null,
      __exists: true,
    }
  } catch {
    return { centerLat: null, centerLng: null, radiusKm: null, __error: true }
  }
}

export async function saveDeliverySettings({ centerLat, centerLng, radiusKm }) {
  const lat = Number(centerLat)
  const lng = Number(centerLng)
  const r = Math.max(0, Number(radiusKm) || 0)
  const toRad = (x) => (x * Math.PI) / 180
  const degLatPerKm = 1 / 110.574
  const degLngPerKm = 1 / (111.320 * Math.cos(toRad(lat || 0)) || 1)
  const dLat = r * degLatPerKm
  const dLng = r * degLngPerKm
  const payload = {
    centerLat: lat,
    centerLng: lng,
    radiusKm: r,
    minLat: lat - dLat,
    maxLat: lat + dLat,
    minLng: lng - dLng,
    maxLng: lng + dLng,
    updatedAt: serverTimestamp(),
  }
  await setDoc(doc(db, 'miscellaneous', 'settings'), payload, { merge: true })
  return true
}
