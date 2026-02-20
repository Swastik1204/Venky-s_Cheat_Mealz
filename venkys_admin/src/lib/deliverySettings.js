// Delivery geo-fence settings (admin)
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const SETTINGS_DOC = doc(db, 'miscellaneous', 'settings')

export async function fetchDeliverySettings() {
  try {
    const snap = await getDoc(SETTINGS_DOC)
    if (!snap.exists()) {
      return { centerLat: null, centerLng: null, radiusKm: null, __exists: false }
    }
    const data = snap.data() || {}
    const centerLat = typeof data.centerLat === 'number'
      ? data.centerLat
      : (typeof data.minLat === 'number' && typeof data.maxLat === 'number'
        ? (data.minLat + data.maxLat) / 2
        : null)
    const centerLng = typeof data.centerLng === 'number'
      ? data.centerLng
      : (typeof data.minLng === 'number' && typeof data.maxLng === 'number'
        ? (data.minLng + data.maxLng) / 2
        : null)
    return {
      centerLat,
      centerLng,
      radiusKm: typeof data.radiusKm === 'number' ? data.radiusKm : null,
      minLat: typeof data.minLat === 'number' ? data.minLat : null,
      maxLat: typeof data.maxLat === 'number' ? data.maxLat : null,
      minLng: typeof data.minLng === 'number' ? data.minLng : null,
      maxLng: typeof data.maxLng === 'number' ? data.maxLng : null,
      __exists: true,
    }
  } catch (err) {
    console.warn('[deliverySettings] fetch failed', err)
    return { centerLat: null, centerLng: null, radiusKm: null, __error: true }
  }
}

export async function saveDeliverySettings({ centerLat, centerLng, radiusKm }) {
  const lat = Number(centerLat)
  const lng = Number(centerLng)
  const radius = Math.max(0, Number(radiusKm) || 0)
  const toRad = (x) => (x * Math.PI) / 180
  const degLatPerKm = 1 / 110.574
  const degLngPerKm = 1 / (111.320 * Math.cos(toRad(lat || 0)) || 1)
  const dLat = radius * degLatPerKm
  const dLng = radius * degLngPerKm
  const payload = {
    centerLat: lat,
    centerLng: lng,
    radiusKm: radius,
    minLat: lat - dLat,
    maxLat: lat + dLat,
    minLng: lng - dLng,
    maxLng: lng + dLng,
    updatedAt: serverTimestamp(),
  }
  await setDoc(SETTINGS_DOC, payload, { merge: true })
  return true
}
