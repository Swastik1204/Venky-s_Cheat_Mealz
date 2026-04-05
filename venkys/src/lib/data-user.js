// User profile, addresses, and theme preferences
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { safeRandomId, normalizeTextKey } from './data-common'

function addressSignature(address = {}) {
  return [
    normalizeTextKey(address?.line1),
    normalizeTextKey(address?.line2),
    normalizeTextKey(address?.city),
    normalizeTextKey(address?.zip),
    normalizeTextKey(address?.placeId),
  ].join('|')
}

// ── Users ──
export async function getUser(uid) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ── User preferences (theme) ──
export async function getUserTheme(uid) {
  if (!uid) return null
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return null
    const t = snap.data().theme
    return t === 'venkys_dark' || t === 'venkys_light' ? t : null
  } catch {
    return null
  }
}

export async function setUserTheme(uid, theme) {
  if (!uid) return
  const normalized = theme === 'venkys_dark' ? 'venkys_dark' : 'venkys_light'
  await setDoc(doc(db, 'users', uid), { theme: normalized, updatedAt: serverTimestamp() }, { merge: true })
}

// ── User Profile ──
export async function fetchUserProfile(uid) {
  if (!uid) return null
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  } catch (e) {
    console.warn('fetchUserProfile failed', e)
    return null
  }
}

export async function updateUserProfile(uid, data) {
  if (!uid) return
  const allowed = ['displayName', 'phone', 'whatsapp', 'gender', 'email']
  const out = {}
  for (const k of allowed) {
    if (data[k] !== undefined) out[k] = data[k]
  }
  await setDoc(doc(db, 'users', uid), { ...out, updatedAt: serverTimestamp() }, { merge: true })
}

// ── Addresses ──
export async function addAddress(uid, address) {
  if (!uid) return
  const ref = doc(db, 'users', uid, 'meta', 'addresses')
  const snap = await getDoc(ref)
  const list = snap.exists() && Array.isArray(snap.data().list) ? snap.data().list : []
  const id = address.id || safeRandomId('addr')
  const normalized = (() => {
    const nm = (v) => (typeof v === 'string' ? v.trim() : v)
    const obj = {
      id,
      name: nm(address.name) || nm(address.tag) || 'Address',
      tag: nm(address.tag) || 'Other',
      line1: nm(address.line1) || '',
      ...(nm(address.line2) ? { line2: nm(address.line2) } : {}),
      city: nm(address.city) || '',
      zip: nm(address.zip) || '',
      ...(nm(address.phone) ? { phone: nm(address.phone) } : {}),
      ...(typeof address.lat === 'number' ? { lat: address.lat } : {}),
      ...(typeof address.lng === 'number' ? { lng: address.lng } : {}),
      ...(nm(address.placeId) ? { placeId: nm(address.placeId) } : {}),
      ...(nm(address.mapUrl) ? { mapUrl: nm(address.mapUrl) } : {}),
    }
    return obj
  })()
  const signature = addressSignature(normalized)
  const existing = list.find(a => addressSignature(a) === signature)
  if (existing) return existing.id
  const next = [...list, normalized]
  const payload = { list: next, updatedAt: serverTimestamp() }
  if (list.length === 0) payload.defaultId = id
  await setDoc(ref, payload, { merge: true })
  return id
}

export async function updateAddress(uid, id, patch) {
  if (!uid) return
  const ref = doc(db, 'users', uid, 'meta', 'addresses')
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  const list = Array.isArray(data.list) ? data.list : []
  const nm = (v) => (typeof v === 'string' ? v.trim() : v)
  const allowedKeys = new Set(['name','tag','line1','line2','city','zip','phone','lat','lng','placeId','mapUrl'])
  const cleaned = {}
  Object.entries(patch || {}).forEach(([k,v]) => {
    if (!allowedKeys.has(k)) return
    const val = nm(v)
    if (val === '' || val === undefined) {
      cleaned[k] = ''
    } else {
      cleaned[k] = val
    }
  })
  const next = list.map(a => {
    if (a.id !== id) return a
    const base = {
      id: a.id,
      name: nm(cleaned.name ?? a.name) || nm(cleaned.tag ?? a.tag) || 'Address',
      tag: nm(cleaned.tag ?? a.tag) || 'Other',
      line1: nm(cleaned.line1 ?? a.line1) || '',
      ...(nm(cleaned.line2 ?? a.line2) ? { line2: nm(cleaned.line2 ?? a.line2) } : {}),
      city: nm(cleaned.city ?? a.city) || '',
      zip: nm(cleaned.zip ?? a.zip) || '',
      ...(nm(cleaned.phone ?? a.phone) ? { phone: nm(cleaned.phone ?? a.phone) } : {}),
      ...(typeof (cleaned.lat ?? a.lat) === 'number' ? { lat: Number(cleaned.lat ?? a.lat) } : {}),
      ...(typeof (cleaned.lng ?? a.lng) === 'number' ? { lng: Number(cleaned.lng ?? a.lng) } : {}),
      ...(nm(cleaned.placeId ?? a.placeId) ? { placeId: nm(cleaned.placeId ?? a.placeId) } : {}),
      ...(nm(cleaned.mapUrl ?? a.mapUrl) ? { mapUrl: nm(cleaned.mapUrl ?? a.mapUrl) } : {}),
    }
    return base
  })
  const updated = next.find(a => a.id === id)
  if (updated) {
    const sig = addressSignature(updated)
    const duplicate = next.find(a => a.id !== id && addressSignature(a) === sig)
    if (duplicate) throw new Error('Duplicate address entry is not allowed')
  }
  await setDoc(ref, { list: next, updatedAt: serverTimestamp() }, { merge: true })
}

export async function deleteAddress(uid, id) {
  if (!uid) return
  const ref = doc(db, 'users', uid, 'meta', 'addresses')
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  const list = Array.isArray(data.list) ? data.list : []
  const next = list.filter(a => a.id !== id)
  const payload = { list: next, updatedAt: serverTimestamp() }
  if (data.defaultId === id) {
    payload.defaultId = next.length ? next[0].id : null
  }
  await setDoc(ref, payload, { merge: true })
}

export async function fetchAddresses(uid) {
  if (!uid) return []
  const ref = doc(db, 'users', uid, 'meta', 'addresses')
  const snap = await getDoc(ref)
  if (!snap.exists()) return { list: [], defaultId: null }
  const data = snap.data()
  return { list: Array.isArray(data.list) ? data.list : [], defaultId: data.defaultId || null }
}

export async function setDefaultAddress(uid, id) {
  if (!uid || !id) return
  const ref = doc(db, 'users', uid, 'meta', 'addresses')
  await setDoc(ref, { defaultId: id, updatedAt: serverTimestamp() }, { merge: true })
}

export function getProfileCompletion(profile) {
  const p = profile && typeof profile === 'object' ? profile : {}
  const addresses = (() => {
    if (Array.isArray(p.addresses)) return p.addresses
    if (p.addresses && Array.isArray(p.addresses.list)) return p.addresses.list
    if (Array.isArray(p.savedAddresses)) return p.savedAddresses
    return []
  })()

  const checks = [
    { ok: !!String(p.displayName || '').trim(), label: 'Display name' },
    { ok: !!String(p.phone || '').replace(/\D/g, '').trim(), label: 'Phone number' },
    { ok: !!String(p.email || '').trim(), label: 'Email address' },
    { ok: !!String(p.photoURL || '').trim(), label: 'Profile photo' },
    { ok: addresses.length > 0, label: 'Saved address' },
  ]

  const filled = checks.filter((c) => c.ok).length
  return {
    percent: Math.max(0, Math.min(100, filled * 20)),
    missing: checks.filter((c) => !c.ok).map((c) => c.label),
  }
}
