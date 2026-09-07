// Staff / roles management (admin)
//
// updateStaffMember/removeStaffMember route through /api/invites
// (updateStaff/removeStaff actions) instead of writing roles/{email}
// directly — firestore.rules denies direct update/delete on that
// collection now (allow update/delete: if false) specifically so a role
// change or removal can't happen without the server also calling
// revokeRefreshTokens, which a client Firestore write has no way to do
// (that's an Admin-SDK-only operation). See api/invites.js's header
// comment for the full "why".
import { collection, doc, getDocs, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { apiClient } from '../utils/apiClient'
import { logStaffChange } from './auditLog'

function normalizeRolePages(pages) {
  if (!pages || typeof pages !== 'object') return null
  const out = {}
  for (const [k, v] of Object.entries(pages)) {
    out[k] = !!v
  }
  return out
}

function assertValidStaffRole(role) {
  if (!['admin', 'staff', 'delivery'].includes(role)) throw new Error('Invalid role - must be admin, staff, or delivery')
}

export { normalizeRolePages, assertValidStaffRole }

export async function fetchStaff() {
  try {
    const snap = await getDocs(collection(db, 'roles'))
    return snap.docs.map(d => ({ email: d.id, ...d.data() }))
  } catch (err) {
    console.error('[firestore] fetchStaff failed', err)
    return []
  }
}

export async function getStaffMember(email) {
  if (!email) return null
  try {
    const ref = doc(db, 'roles', email.toLowerCase().trim())
    const snap = await getDoc(ref)
    return snap.exists() ? { email: snap.id, ...snap.data() } : null
  } catch (err) {
    console.error('[firestore] getStaffMember failed', err)
    return null
  }
}

export async function addStaffMember(email, role, name, addedByEmail, pages = null, defaultPage = null) {
  if (!email || !role) throw new Error('Email and role are required')
  const normalizedEmail = email.toLowerCase().trim()
  assertValidStaffRole(role)
  const ref = doc(db, 'roles', normalizedEmail)
  const existing = await getDoc(ref)
  if (existing.exists()) throw new Error('Staff member already exists for this email')

  const newData = {
    role,
    name: name || '',
    addedAt: serverTimestamp(),
    addedBy: addedByEmail || null
  }

  const normalizedPages = normalizeRolePages(pages)
  if (normalizedPages) newData.pages = normalizedPages
  if (defaultPage && typeof defaultPage === 'string') newData.defaultPage = defaultPage

  await setDoc(ref, newData)

  await logStaffChange('create', normalizedEmail, null, { ...newData, email: normalizedEmail }, addedByEmail, {
    reason: 'Staff member added'
  })

  return { email: normalizedEmail, role, name, defaultPage: defaultPage || null }
}

export async function updateStaffMember(email, updates, updatedByEmail) {
  if (!email) throw new Error('Email is required')
  const normalizedEmail = email.toLowerCase().trim()
  const ref = doc(db, 'roles', normalizedEmail)
  if (updates?.role) assertValidStaffRole(updates.role)

  const beforeSnap = await getDoc(ref)
  const before = beforeSnap.exists() ? { email: normalizedEmail, ...beforeSnap.data() } : null

  const res = await apiClient.post('/api/invites', { action: 'updateStaff', email: normalizedEmail, updates })
  if (!res.ok) {
    throw new Error(res.body?.error || res.message || 'Failed to update staff member')
  }

  const afterSnap = await getDoc(ref)
  const after = afterSnap.exists() ? { email: normalizedEmail, ...afterSnap.data() } : null

  await logStaffChange('update', normalizedEmail, before, after, updatedByEmail, {
    reason: 'Staff member updated'
  })
}

export async function removeStaffMember(email, removedByEmail) {
  if (!email) throw new Error('Email is required')
  const normalizedEmail = email.toLowerCase().trim()
  const ref = doc(db, 'roles', normalizedEmail)

  const beforeSnap = await getDoc(ref)
  const before = beforeSnap.exists() ? { email: normalizedEmail, ...beforeSnap.data() } : null

  const res = await apiClient.post('/api/invites', { action: 'removeStaff', email: normalizedEmail })
  if (!res.ok) {
    throw new Error(res.body?.error || res.message || 'Failed to remove staff member')
  }

  await logStaffChange('delete', normalizedEmail, before, null, removedByEmail, {
    reason: 'Staff member removed'
  })
}
