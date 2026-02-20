// Staff / roles management (admin)
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, serverTimestamp, deleteField } from 'firebase/firestore'
import { db } from './firebase'
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

  // Promoting to admin: clear stale per-page permissions / default landing
  if (updates?.role === 'admin') {
    updates = { ...updates, pages: deleteField(), defaultPage: deleteField() }
  }
  if (Object.prototype.hasOwnProperty.call(updates || {}, 'pages')) {
    updates = { ...updates, pages: normalizeRolePages(updates.pages) }
  }

  const beforeSnap = await getDoc(ref)
  const before = beforeSnap.exists() ? { email: normalizedEmail, ...beforeSnap.data() } : null

  const updateData = { ...updates, updatedAt: serverTimestamp(), updatedBy: updatedByEmail || null }
  await setDoc(ref, updateData, { merge: true })

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

  await deleteDoc(ref)

  await logStaffChange('delete', normalizedEmail, before, null, removedByEmail, {
    reason: 'Staff member removed'
  })
}
