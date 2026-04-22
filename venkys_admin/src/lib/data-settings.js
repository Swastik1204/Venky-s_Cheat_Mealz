// Appearance settings, app settings, business profile (admin)
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { DEFAULT_SPOTLIGHT, normalizeSpotlight } from './data-common'
import { logSettingsChange } from './auditLog'
import { recordChange } from './data-changeHistory'

function resolveActor(performedBy) {
  return String(performedBy || 'system')
}

async function safeRecordChange(payload) {
  try {
    await recordChange(payload)
  } catch (err) {
    console.error('[changeHistory] settings record failed', err)
  }
}

// ── Appearance ──
export async function fetchAppearanceSettings() {
  try {
    const ref = doc(db, 'miscellaneous', 'appearance')
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      const fallback = { categoriesOrder: [], spotlight: DEFAULT_SPOTLIGHT }
      try {
        const before = null
        await setDoc(ref, { ...fallback, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true })
        const afterSnap = await getDoc(ref)
        await safeRecordChange({
          collection: 'miscellaneous',
          docId: 'appearance',
          before,
          after: afterSnap.exists() ? afterSnap.data() : null,
          action: 'create',
          performedBy: resolveActor('system'),
          description: 'Appearance settings document initialized',
        })
      } catch (err) {
        console.warn('[firestore] unable to prime appearance doc', err)
      }
      return { categoriesOrder: [], spotlight: { ...DEFAULT_SPOTLIGHT }, __exists: false }
    }
    const data = snap.data() || {}
    const categoriesOrder = Array.isArray(data.categoriesOrder) ? data.categoriesOrder : []
    const spotlight = normalizeSpotlight(data.spotlight || DEFAULT_SPOTLIGHT)

    // Backfill spotlight flags if missing
    const needsFlagBackfill = !data.spotlight || (
      data.spotlight && (
        data.spotlight.hiddenSpotlight === undefined ||
        data.spotlight.hiddenHotDeals === undefined ||
        data.spotlight.hiddenChefSpecials === undefined
      )
    )
    // Also backfill if deprecated fields still exist in entries
    const hasDeprecated = (() => {
      const hasBad = (arr) => Array.isArray(arr) && arr.some((e) => e && typeof e === 'object' && (
        Object.prototype.hasOwnProperty.call(e, 'label') ||
        Object.prototype.hasOwnProperty.call(e, 'caption') ||
        Object.prototype.hasOwnProperty.call(e, 'badge') ||
        Object.prototype.hasOwnProperty.call(e, 'itemIndex')
      ))
      return hasBad(data.spotlight?.hotDeals) || hasBad(data.spotlight?.chefSpecials)
    })()
    if (needsFlagBackfill || hasDeprecated) {
      try {
        const before = data
        await setDoc(ref, { spotlight, updatedAt: serverTimestamp() }, { merge: true })
        const afterSnap = await getDoc(ref)
        await safeRecordChange({
          collection: 'miscellaneous',
          docId: 'appearance',
          before,
          after: afterSnap.exists() ? afterSnap.data() : null,
          action: 'update',
          performedBy: resolveActor('system'),
          description: 'Appearance spotlight settings backfilled',
        })
      } catch (err) {
        console.warn('[firestore] unable to backfill spotlight field', err)
      }
    }
    return { categoriesOrder, spotlight, __exists: true }
  } catch (e) {
    console.error('[firestore] fetchAppearanceSettings failed', e)
    return { categoriesOrder: [], spotlight: { ...DEFAULT_SPOTLIGHT }, __exists: false }
  }
}

export async function saveCategoriesOrder(orderIds, performedBy = null) {
  if (!Array.isArray(orderIds)) return false
  const ref = doc(db, 'miscellaneous', 'appearance')
  const beforeSnap = await getDoc(ref)
  const before = beforeSnap.exists() ? beforeSnap.data() : null

  await setDoc(ref, { categoriesOrder: orderIds, updatedAt: serverTimestamp() }, { merge: true })

  const afterSnap = await getDoc(ref)
  await safeRecordChange({
    collection: 'miscellaneous',
    docId: 'appearance',
    before,
    after: afterSnap.exists() ? afterSnap.data() : null,
    action: beforeSnap.exists() ? 'update' : 'create',
    performedBy: resolveActor(performedBy),
    description: 'Category order updated',
  })

  return true
}

export async function saveAppearanceSpotlight(spotlightLike, performedBy = null) {
  const ref = doc(db, 'miscellaneous', 'appearance')
  const beforeSnap = await getDoc(ref)
  const before = beforeSnap.exists() ? beforeSnap.data() : null
  const spotlight = normalizeSpotlight(spotlightLike || DEFAULT_SPOTLIGHT)
  await setDoc(ref, { spotlight, updatedAt: serverTimestamp() }, { merge: true })

  const afterSnap = await getDoc(ref)
  await safeRecordChange({
    collection: 'miscellaneous',
    docId: 'appearance',
    before,
    after: afterSnap.exists() ? afterSnap.data() : null,
    action: beforeSnap.exists() ? 'update' : 'create',
    performedBy: resolveActor(performedBy),
    description: 'Appearance spotlight updated',
  })

  return spotlight
}

// ── App settings ──
export async function fetchAppSettings() {
  try {
    const snap = await getDoc(doc(db, 'miscellaneous', 'settings'))
    if (!snap.exists()) return {
      gstRate: 0.05,
      adminMobile: '',
      cashManagerPhones: [],
      orderMessengerPhones: [],
      shopAddress: '',
      shopPhone: '',
      chefName: '',
      centerLat: '',
      centerLng: '',
      radiusKm: 8,
      locationLink: '',
      minLat: null,
      maxLat: null,
      minLng: null,
      maxLng: null,
      googlePlaceId: ''
    }
    const d = snap.data()
    const normalize10 = (p) => {
      let digits = String(p || '').replace(/\D/g, '')
      if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
      return digits.length === 10 ? digits : null
    }
    const gstRate = typeof d.gstRate === 'number' ? d.gstRate : (Number(d.gstRate) || 0.05)
    const adminMobile = d.adminMobile || ''
    const orderMessengerPhones = Array.isArray(d.orderMessengerPhones)
      ? d.orderMessengerPhones.map((p) => normalize10(p)).filter(Boolean)
      : []
    const shopAddress = d.shopAddress || ''
    const shopPhone = d.shopPhone || ''
    const chefName = d.chefName || ''
    const centerLat = typeof d.centerLat === 'number' ? String(d.centerLat) : (typeof d.centerLat === 'string' ? d.centerLat : '')
    const centerLng = typeof d.centerLng === 'number' ? String(d.centerLng) : (typeof d.centerLng === 'string' ? d.centerLng : '')
    const radiusKm = typeof d.radiusKm === 'number' ? d.radiusKm : 8
    const locationLink = typeof d.locationLink === 'string' ? d.locationLink : ''
    const minLat = typeof d.minLat === 'number' ? d.minLat : null
    const maxLat = typeof d.maxLat === 'number' ? d.maxLat : null
    const minLng = typeof d.minLng === 'number' ? d.minLng : null
    const maxLng = typeof d.maxLng === 'number' ? d.maxLng : null
    const googlePlaceId = d.googlePlaceId || ''
    const cashManagerPhones = Array.isArray(d.cashManagerPhones)
      ? d.cashManagerPhones.map((p) => normalize10(p)).filter(Boolean)
      : []
    return {
      gstRate,
      cashManagerPhones,
      adminMobile,
      orderMessengerPhones,
      shopAddress,
      shopPhone,
      chefName,
      centerLat,
      centerLng,
      radiusKm,
      locationLink,
      minLat,
      maxLat,
      minLng,
      maxLng,
      googlePlaceId
    }
  } catch {
    return {
      gstRate: 0.05,
      cashManagerPhones: [],
      adminMobile: '',
      orderMessengerPhones: [],
      shopAddress: '',
      shopPhone: '',
      chefName: '',
      centerLat: '',
      centerLng: '',
      radiusKm: 8,
      locationLink: '',
      minLat: null,
      maxLat: null,
      minLng: null,
      maxLng: null,
      googlePlaceId: ''
    }
  }
}

export async function saveAppSettings(partial, performedBy = null) {
  const payload = {}
  const normalize10 = (p) => {
    let digits = String(p || '').replace(/\D/g, '')
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
    return digits.length === 10 ? digits : ''
  }
  if (partial.gstRate !== undefined) payload.gstRate = Number(partial.gstRate) || 0
  if (partial.adminMobile !== undefined) payload.adminMobile = String(partial.adminMobile || '')
  if (partial.cashManagerPhones !== undefined) {
    payload.cashManagerPhones = Array.isArray(partial.cashManagerPhones)
      ? partial.cashManagerPhones.map((p) => normalize10(p)).filter(Boolean)
      : []
  }
  if (partial.orderMessengerPhones !== undefined) {
    payload.orderMessengerPhones = Array.isArray(partial.orderMessengerPhones)
      ? partial.orderMessengerPhones.map((p) => normalize10(p)).filter(Boolean)
      : []
  }
  if (partial.shopAddress !== undefined) payload.shopAddress = String(partial.shopAddress || '')
  if (partial.shopPhone !== undefined) payload.shopPhone = String(partial.shopPhone || '')
  if (partial.chefName !== undefined) payload.chefName = String(partial.chefName || '')

  if (partial.googlePlaceId !== undefined) payload.googlePlaceId = String(partial.googlePlaceId || '')
  // Delivery fields
  if (partial.centerLat !== undefined) payload.centerLat = Number(partial.centerLat)
  if (partial.centerLng !== undefined) payload.centerLng = Number(partial.centerLng)
  if (partial.radiusKm !== undefined) payload.radiusKm = Number(partial.radiusKm)
  if (partial.locationLink !== undefined) payload.locationLink = String(partial.locationLink || '')
  // Calculate bounding box if all geo fields provided
  if (payload.centerLat != null && payload.centerLng != null && payload.radiusKm != null) {
    const toRad = (x) => (x * Math.PI) / 180
    const degLatPerKm = 1 / 110.574
    const degLngPerKm = 1 / (111.320 * Math.cos(toRad(payload.centerLat || 0)) || 1)
    const dLat = payload.radiusKm * degLatPerKm
    const dLng = payload.radiusKm * degLngPerKm
    payload.minLat = payload.centerLat - dLat
    payload.maxLat = payload.centerLat + dLat
    payload.minLng = payload.centerLng - dLng
    payload.maxLng = payload.centerLng + dLng
  }

  // Audit: capture before state
  const ref = doc(db, 'miscellaneous', 'settings')
  const beforeSnap = await getDoc(ref)
  const before = beforeSnap.exists() ? beforeSnap.data() : null

  await setDoc(ref, { ...payload, updatedAt: serverTimestamp() }, { merge: true })

  // Audit: capture after state
  const afterSnap = await getDoc(ref)
  const after = afterSnap.exists() ? afterSnap.data() : null

  const actor = resolveActor(performedBy)

  await safeRecordChange({
    collection: 'miscellaneous',
    docId: 'settings',
    before,
    after,
    action: beforeSnap.exists() ? 'update' : 'create',
    performedBy: actor,
    description: `App settings updated by ${actor}`,
  })

  await logSettingsChange('update', 'settings', before, after, actor, {
    reason: 'App settings updated',
    fields: Object.keys(payload)
  }).catch(err => console.error('Failed to log settings update:', err))

  return true
}

// ── Business Profile (synced from Google Places) ──
export async function fetchBusinessProfile() {
  try {
    const snap = await getDoc(doc(db, 'miscellaneous', 'businessProfile'))
    if (!snap.exists()) return null
    return snap.data()
  } catch {
    return null
  }
}

export async function syncBusinessProfile(placeId) {
  const url = import.meta.env.VITE_SYNC_BUSINESS_PROFILE_URL || '/api/sync-business-profile'
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId })
    })
  } catch {
    throw new Error(
      `Sync failed: cannot reach the sync API. ` +
      `In dev, Vite doesn't serve /api routes. Run \`vercel dev\` (default http://localhost:3000) ` +
      `or set VITE_SYNC_BUSINESS_PROFILE_URL to your deployed /api/sync-business-profile URL.`
    )
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    if (res.status === 404 && String(url || '').startsWith('/')) {
      throw new Error(
        `Sync failed: /api/sync-business-profile not found (404). ` +
        `In dev, start \`vercel dev\` so /api routes exist (and keep Vite running), ` +
        `or set VITE_SYNC_BUSINESS_PROFILE_URL to a deployed API URL.`
      )
    }
    throw new Error(error.error || `Sync failed: ${res.status}`)
  }
  return res.json()
}
