// App settings, appearance, store status, and business profile
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { DEFAULT_SPOTLIGHT, normalizeSpotlight, isPermissionDenied } from './data-common'

// ── Appearance / miscellaneous helpers ──
export async function fetchAppearanceSettings() {
  try {
    const ref = doc(db, 'miscellaneous', 'appearance')
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      const fallback = { categoriesOrder: [], spotlight: DEFAULT_SPOTLIGHT }
      try { await setDoc(ref, { ...fallback, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }) } catch (err) { console.warn('[firestore] appearance doc init failed', err) }
      return { categoriesOrder: [], spotlight: { ...DEFAULT_SPOTLIGHT }, __exists: false }
    }
    const data = snap.data() || {}
    const categoriesOrder = Array.isArray(data.categoriesOrder) ? data.categoriesOrder : []
    const spotlight = normalizeSpotlight(data.spotlight || DEFAULT_SPOTLIGHT)
    const needsFlagBackfill = !data.spotlight || (
      data.spotlight && (
        data.spotlight.hiddenSpotlight === undefined ||
        data.spotlight.hiddenHotDeals === undefined ||
        data.spotlight.hiddenChefSpecials === undefined
      )
    )
    const hasDeprecated = (() => {
      const hasBad = (arr) => Array.isArray(arr) && arr.some((e) => e && typeof e === 'object' && (
        Object.prototype.hasOwnProperty.call(e, 'label') ||
        Object.prototype.hasOwnProperty.call(e, 'caption') ||
        Object.prototype.hasOwnProperty.call(e, 'badge') ||
        Object.prototype.hasOwnProperty.call(e, 'itemIndex')
      ))
      return hasBad(data.spotlight?.hotDeals) || hasBad(data.spotlight?.chefSpecials)
    })()
    const needsBackfill = needsFlagBackfill || hasDeprecated
    if (needsBackfill) {
      try { await setDoc(ref, { spotlight, updatedAt: serverTimestamp() }, { merge: true }) } catch (err) { console.warn('[firestore] appearance spotlight backfill failed', err) }
    }
    return { categoriesOrder, spotlight, __exists: true }
  } catch (e) {
    if (isPermissionDenied(e)) return { categoriesOrder: [], spotlight: { ...DEFAULT_SPOTLIGHT }, __error: 'permission-denied', __exists: false }
    return { categoriesOrder: [], spotlight: { ...DEFAULT_SPOTLIGHT }, __error: 'other', __exists: false }
  }
}

export async function saveCategoriesOrder(orderIds) {
  if (!Array.isArray(orderIds)) return false
  const ref = doc(db, 'miscellaneous', 'appearance')
  await setDoc(ref, { categoriesOrder: orderIds, updatedAt: serverTimestamp() }, { merge: true })
  return true
}

// ── Store open/closed status ──
export async function fetchStoreStatus() {
  try {
    const settingsRef = doc(db, 'miscellaneous', 'settings')
    const snap = await getDoc(settingsRef)
    if (snap.exists()) {
      const data = snap.data() || {}
      if (Object.prototype.hasOwnProperty.call(data, 'open')) {
        return { open: data.open !== false }
      }
    }
    try {
      const legacySnap = await getDoc(doc(db, 'miscellaneous', 'store'))
      if (legacySnap.exists()) {
        const legacyData = legacySnap.data() || {}
        const open = legacyData.open !== false
        await setDoc(settingsRef, { open, updatedAt: serverTimestamp() }, { merge: true })
        return { open, __migrated: true }
      }
    } catch { /* ignore legacy fetch errors */ }
    return { open: true }
  } catch {
    return { open: true, __error: true }
  }
}

export async function setStoreOpen(open) {
  await setDoc(doc(db, 'miscellaneous', 'settings'), { open: !!open, updatedAt: serverTimestamp() }, { merge: true })
  return true
}

// ── App Settings (GST rate, admin mobile, etc) ──
export async function fetchAppSettings() {
  try {
    const snap = await getDoc(doc(db, 'miscellaneous', 'settings'))
    if (!snap.exists()) return { gstRate: 0.05, adminMobile: '', cashManagerPhones: [], shopAddress: '', shopPhone: '', chefName: '', googlePlaceId: '' }
    const d = snap.data()
    const normalize10 = (p) => {
      let digits = String(p || '').replace(/\D/g, '')
      if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
      return digits.length === 10 ? digits : null
    }
    const gstRate = typeof d.gstRate === 'number' ? d.gstRate : (Number(d.gstRate) || 0.05)
    const adminMobile = d.adminMobile || ''
    let cashManagerPhones = Array.isArray(d.cashManagerPhones) ? d.cashManagerPhones.map(normalize10).filter(Boolean) : []
    const shopAddress = d.shopAddress || ''
    const shopPhone = d.shopPhone || ''
    const chefName = d.chefName || ''
    const googlePlaceId = d.googlePlaceId || ''
    return { gstRate, adminMobile, cashManagerPhones, shopAddress, shopPhone, chefName, googlePlaceId }
  } catch {
    return { gstRate: 0.05, adminMobile: '', cashManagerPhones: [], shopAddress: '', shopPhone: '', chefName: '', googlePlaceId: '', __error: true }
  }
}

export async function saveAppSettings(partial) {
  const payload = {}
  if (partial.gstRate !== undefined) payload.gstRate = Number(partial.gstRate) || 0
  if (partial.adminMobile !== undefined) payload.adminMobile = String(partial.adminMobile || '')
  if (partial.shopAddress !== undefined) payload.shopAddress = String(partial.shopAddress || '')
  if (partial.shopPhone !== undefined) payload.shopPhone = String(partial.shopPhone || '')
  if (partial.chefName !== undefined) payload.chefName = String(partial.chefName || '')
  if (partial.googlePlaceId !== undefined) payload.googlePlaceId = String(partial.googlePlaceId || '')
  await setDoc(doc(db, 'miscellaneous', 'settings'), { ...payload, updatedAt: serverTimestamp() }, { merge: true })
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

import { apiClient } from '../utils/apiClient'

export async function syncBusinessProfile(placeId) {
  const res = await apiClient.post('/api/sync-business-profile', { placeId })
  if (!res.ok) {
    throw new Error(res.message || `Sync failed: ${res.status}`)
  }
  return res.data
}
