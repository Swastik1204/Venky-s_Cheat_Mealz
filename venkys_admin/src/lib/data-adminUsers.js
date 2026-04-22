import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

import { auth, db } from './firebase'
import { recordChange } from './data-changeHistory'

const ADMIN_USERS_COLLECTION = 'adminUsers'
const SUPER_ADMIN_EMAIL = 'swastiksaha1204@gmail.com'
const OTP_MAX_ATTEMPTS = 3
const OTP_EXPIRY_MS = 10 * 60 * 1000
const INVITE_EXPIRY_MS = 48 * 60 * 60 * 1000

function resolveActor(performedBy = null) {
  return String(performedBy || currentUserEmail() || auth.currentUser?.uid || 'system')
}

async function safeRecordChange(payload) {
  try {
    await recordChange(payload)
  } catch (err) {
    console.error('[changeHistory] adminUsers record failed', err)
  }
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '')
}

function normalizeRole(value) {
  const role = String(value || '').trim().toLowerCase()
  if (role === 'admin' || role === 'staff' || role === 'delivery') return role
  return 'staff'
}

function normalizePages(value) {
  if (!value || typeof value !== 'object') return {}
  return Object.entries(value).reduce((acc, [k, v]) => {
    acc[k] = !!v
    return acc
  }, {})
}

function currentUserEmail() {
  return normalizeEmail(auth.currentUser?.email)
}

function isSuperAdminUser() {
  return currentUserEmail() === SUPER_ADMIN_EMAIL
}

function assertSuperAdmin() {
  if (!isSuperAdminUser()) {
    throw new Error('Only super admin can perform this action')
  }
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(value) {
  const text = String(value || '')
  const enc = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', enc)
  return toHex(digest)
}

export async function getAdminUser(uid) {
  if (!uid) return null
  const ref = doc(db, ADMIN_USERS_COLLECTION, String(uid))
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createAdminUser(uid, { email, displayName, nickname, phone, role, pages, invitedBy } = {}) {
  assertSuperAdmin()
  if (!uid) throw new Error('uid is required')

  const inviteToken = crypto.randomUUID()
  const ref = doc(db, ADMIN_USERS_COLLECTION, String(uid))
  const payload = {
    email: normalizeEmail(email),
    displayName: String(displayName || '').trim(),
    nickname: String(nickname || '').trim(),
    phone: normalizePhone(phone),
    role: normalizeRole(role),
    pages: normalizePages(pages),
    invitedBy: String(invitedBy || '').trim() || null,
    status: 'pending',
    registeredAt: serverTimestamp(),
    inviteToken,
    inviteTokenUsed: false,
    inviteTokenExpiry: Date.now() + INVITE_EXPIRY_MS,
    loginOtpHash: null,
    loginOtpExpiry: null,
    loginOtpAttempts: 0,
    lastLoginAt: null,
    updatedAt: serverTimestamp(),
  }

  const beforeSnap = await getDoc(ref)
  await setDoc(ref, payload, { merge: false })

  const afterSnap = await getDoc(ref)
  const createdEmail = normalizeEmail(email)
  await safeRecordChange({
    collection: ADMIN_USERS_COLLECTION,
    docId: String(uid),
    before: beforeSnap.exists() ? beforeSnap.data() : null,
    after: afterSnap.exists() ? afterSnap.data() : null,
    action: 'create',
    performedBy: resolveActor(invitedBy),
    description: `Admin user ${createdEmail || uid} invited`,
  })

  return { id: String(uid), ...payload }
}

export async function activateAdminUser(uid, inviteToken) {
  if (!uid) return { success: false, reason: 'missing_uid' }

  const docData = await getAdminUser(uid)
  if (!docData) return { success: false, reason: 'not_found' }
  if (docData.inviteTokenUsed) return { success: false, reason: 'already_used' }

  const token = String(inviteToken || '').trim()
  if (!token || token !== String(docData.inviteToken || '').trim()) {
    return { success: false, reason: 'invalid_token' }
  }

  const expiry = Number(docData.inviteTokenExpiry || 0)
  if (!Number.isFinite(expiry) || Date.now() > expiry) {
    return { success: false, reason: 'expired' }
  }

  const ref = doc(db, ADMIN_USERS_COLLECTION, String(uid))
  const beforeSnap = await getDoc(ref)
  await updateDoc(ref, {
    inviteTokenUsed: true,
    inviteToken: null,
    inviteTokenExpiry: null,
    status: 'active',
    activatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  const afterSnap = await getDoc(ref)
  await safeRecordChange({
    collection: ADMIN_USERS_COLLECTION,
    docId: String(uid),
    before: beforeSnap.exists() ? beforeSnap.data() : null,
    after: afterSnap.exists() ? afterSnap.data() : null,
    action: 'update',
    performedBy: resolveActor(),
    description: `Admin user ${normalizeEmail(docData.email) || uid} activated`,
  })

  return { success: true }
}

export async function updateAdminUser(uid, updates = {}) {
  assertSuperAdmin()
  if (!uid) throw new Error('uid is required')

  const out = { ...updates }
  if (Object.prototype.hasOwnProperty.call(out, 'email')) out.email = normalizeEmail(out.email)
  if (Object.prototype.hasOwnProperty.call(out, 'phone')) out.phone = normalizePhone(out.phone)
  if (Object.prototype.hasOwnProperty.call(out, 'displayName')) out.displayName = String(out.displayName || '').trim()
  if (Object.prototype.hasOwnProperty.call(out, 'nickname')) out.nickname = String(out.nickname || '').trim()
  if (Object.prototype.hasOwnProperty.call(out, 'role')) out.role = normalizeRole(out.role)
  if (Object.prototype.hasOwnProperty.call(out, 'pages')) out.pages = normalizePages(out.pages)
  out.updatedAt = serverTimestamp()

  const ref = doc(db, ADMIN_USERS_COLLECTION, String(uid))
  const beforeSnap = await getDoc(ref)
  const beforeData = beforeSnap.exists() ? beforeSnap.data() : null
  await updateDoc(ref, out)

  const afterSnap = await getDoc(ref)
  const afterData = afterSnap.exists() ? afterSnap.data() : null
  const email = normalizeEmail(afterData?.email || beforeData?.email || '') || String(uid)
  const oldRole = normalizeRole(beforeData?.role)
  const newRole = normalizeRole(afterData?.role)
  const description = (Object.prototype.hasOwnProperty.call(out, 'role') && oldRole !== newRole)
    ? `User ${email} role changed to ${newRole}`
    : `Admin user ${email} updated`

  await safeRecordChange({
    collection: ADMIN_USERS_COLLECTION,
    docId: String(uid),
    before: beforeData,
    after: afterData,
    action: 'update',
    performedBy: resolveActor(),
    description,
  })
}

export async function suspendAdminUser(uid) {
  assertSuperAdmin()
  if (!uid) throw new Error('uid is required')

  const ref = doc(db, ADMIN_USERS_COLLECTION, String(uid))
  const beforeSnap = await getDoc(ref)
  const beforeData = beforeSnap.exists() ? beforeSnap.data() : null
  await updateDoc(ref, {
    status: 'suspended',
    updatedAt: serverTimestamp(),
  })

  const afterSnap = await getDoc(ref)
  const afterData = afterSnap.exists() ? afterSnap.data() : null
  const email = normalizeEmail(afterData?.email || beforeData?.email || '') || String(uid)
  await safeRecordChange({
    collection: ADMIN_USERS_COLLECTION,
    docId: String(uid),
    before: beforeData,
    after: afterData,
    action: 'update',
    performedBy: resolveActor(),
    description: `User ${email} suspended`,
  })
}

export async function listAdminUsers(status = 'all') {
  assertSuperAdmin()

  const colRef = collection(db, ADMIN_USERS_COLLECTION)
  const normalizedStatus = String(status || 'all').trim().toLowerCase()
  const q = normalizedStatus === 'all'
    ? query(colRef, orderBy('registeredAt', 'desc'))
    : query(colRef, where('status', '==', normalizedStatus), orderBy('registeredAt', 'desc'))

  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function generateLoginOtp(uid) {
  if (!uid) throw new Error('uid is required')
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const hash = await sha256Hex(otp)

  const ref = doc(db, ADMIN_USERS_COLLECTION, String(uid))
  const beforeSnap = await getDoc(ref)
  await updateDoc(ref, {
    loginOtpHash: hash,
    loginOtpExpiry: Date.now() + OTP_EXPIRY_MS,
    loginOtpAttempts: 0,
    updatedAt: serverTimestamp(),
  })

  const afterSnap = await getDoc(ref)
  await safeRecordChange({
    collection: ADMIN_USERS_COLLECTION,
    docId: String(uid),
    before: beforeSnap.exists() ? beforeSnap.data() : null,
    after: afterSnap.exists() ? afterSnap.data() : null,
    action: 'update',
    performedBy: resolveActor(),
    description: `Login OTP generated for ${normalizeEmail(afterSnap.data()?.email) || uid}`,
  })

  return otp
}

export async function verifyLoginOtp(uid, otpInput) {
  if (!uid) return { success: false, reason: 'missing_uid' }

  const userDoc = await getAdminUser(uid)
  if (!userDoc) return { success: false, reason: 'not_found' }

  const attempts = Number(userDoc.loginOtpAttempts || 0)
  if (attempts >= OTP_MAX_ATTEMPTS) {
    return { success: false, reason: 'locked' }
  }

  const expiry = Number(userDoc.loginOtpExpiry || 0)
  if (!Number.isFinite(expiry) || Date.now() > expiry) {
    return { success: false, reason: 'expired' }
  }

  const inputHash = await sha256Hex(String(otpInput || '').trim())
  const savedHash = String(userDoc.loginOtpHash || '')

  const ref = doc(db, ADMIN_USERS_COLLECTION, String(uid))
  if (savedHash && inputHash === savedHash) {
    const beforeSnap = await getDoc(ref)
    await updateDoc(ref, {
      loginOtpHash: null,
      loginOtpExpiry: null,
      loginOtpAttempts: 0,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const afterSnap = await getDoc(ref)
    await safeRecordChange({
      collection: ADMIN_USERS_COLLECTION,
      docId: String(uid),
      before: beforeSnap.exists() ? beforeSnap.data() : null,
      after: afterSnap.exists() ? afterSnap.data() : null,
      action: 'update',
      performedBy: resolveActor(),
      description: `OTP verified for ${normalizeEmail(userDoc.email) || uid}`,
    })

    return { success: true }
  }

  const newCount = attempts + 1
  const beforeSnap = await getDoc(ref)
  await updateDoc(ref, {
    loginOtpAttempts: newCount,
    updatedAt: serverTimestamp(),
  })

  const afterSnap = await getDoc(ref)
  await safeRecordChange({
    collection: ADMIN_USERS_COLLECTION,
    docId: String(uid),
    before: beforeSnap.exists() ? beforeSnap.data() : null,
    after: afterSnap.exists() ? afterSnap.data() : null,
    action: 'update',
    performedBy: resolveActor(),
    description: `OTP attempt ${newCount} for ${normalizeEmail(userDoc.email) || uid}`,
  })

  if (newCount >= OTP_MAX_ATTEMPTS) {
    return { success: false, reason: 'locked' }
  }

  return {
    success: false,
    reason: 'invalid',
    attemptsLeft: OTP_MAX_ATTEMPTS - newCount,
  }
}
