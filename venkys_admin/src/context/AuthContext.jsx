// AuthContext — Firebase auth with role-based access control
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

import { auth, db } from '../lib/firebase'
import { getAdminUser } from '../lib/data-adminUsers'
import { ensureUserDocument } from '../lib/userData'

const AuthContext = createContext(null)
const SUPER_ADMIN_EMAIL = 'swastiksaha1204@gmail.com'

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function canAccessForRole(roleName, pages, pageKey) {
  const page = String(pageKey || '').trim().toLowerCase()
  const role = String(roleName || '').trim().toLowerCase()
  if (!role || !page) return false
  if (role === 'admin') return true
  if (role === 'delivery') return page === 'delivery'
  if (role !== 'staff') return false

  const safePages = pages && typeof pages === 'object' ? pages : {}
  const has = (key) => !!safePages[key]

  const matrix = {
    biller: has('biller'),
    orders: has('orders') || has('biller') || has('cashManager') || has('orderMessenger'),
    inventory: has('inventory'),
    stock: has('stock') || has('inventory') || has('biller'),
    analytics: has('analytics'),
    settings: has('settings'),
    appearance: has('appearance'),
    delivery: has('delivery') || has('orders'),
    cashmanager: has('cashManager'),
    ordermessenger: has('orderMessenger'),
    logs: false,
  }

  return !!matrix[page]
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null) // null | { isStaffMember, role, isAdmin }
  const [adminUserDoc, setAdminUserDoc] = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)

  const canAccess = useCallback((pageKey) => {
    const page = String(pageKey || '').trim().toLowerCase()
    if (page === 'logs') {
      return normalizeEmail(user?.email) === SUPER_ADMIN_EMAIL
    }

    if (normalizeEmail(user?.email) === SUPER_ADMIN_EMAIL) {
      return true
    }

    // adminUsers doc takes precedence when present.
    // TODO: deprecate roles fallback after all staff migrated and keep both working for now.
    if (adminUserDoc) {
      if (adminUserDoc.status !== 'active') return false
      return canAccessForRole(adminUserDoc.role, adminUserDoc.pages, page)
    }

    if (!role?.isStaffMember) return false
    return canAccessForRole(role?.role, role?.pages, page)
  }, [adminUserDoc, role, user?.email])

  // Check user role from /roles/{email} collection
  const refreshRole = useCallback(async (email, uid) => {
    if (!email && !uid) {
      setRole(null)
      setAdminUserDoc(null)
      setRoleLoading(false)
      return
    }

    setRoleLoading(true)
    try {
      const [roleSnap, adminUserSnap] = await Promise.all([
        email ? getDoc(doc(db, 'roles', normalizeEmail(email))) : Promise.resolve(null),
        uid ? getAdminUser(uid) : Promise.resolve(null),
      ])

      setAdminUserDoc(adminUserSnap || null)

      // TODO: deprecate roles fallback after all staff migrated and keep both working for now.
      if (roleSnap && roleSnap.exists()) {
        const data = roleSnap.data()
        const userRole = data.role || 'staff'
        setRole({
          isStaffMember: true,
          role: userRole,
          name: data.name || '',
          pages: data.pages && typeof data.pages === 'object' ? data.pages : null,
          defaultPage: data.defaultPage || null,
          isAdmin: userRole === 'admin',
          isStaff: userRole === 'staff',
        isDelivery: userRole === 'delivery'
        })
      } else {
        // No role document = no access
      setRole({ isStaffMember: false, role: null, isAdmin: false, isStaff: false, isDelivery: false, pages: null, defaultPage: null, name: '' })
      }
    } catch (err) {
      console.error('[AuthContext] Role check failed:', err)
      setRole({ isStaffMember: false, role: null, isAdmin: false, isStaff: false, isDelivery: false, pages: null, defaultPage: null, name: '' })
      setAdminUserDoc(null)
    } finally {
      setRoleLoading(false)
    }
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await refreshRole(firebaseUser.email, firebaseUser.uid)
      } else {
        setRole(null)
        setAdminUserDoc(null)
        setRoleLoading(false)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [refreshRole])

  const signup = useCallback(async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) await updateProfile(cred.user, { displayName })
    await ensureUserDocument(cred.user)
    return cred.user
  }, [])

  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    return cred.user
  }, [])

  const getRecaptchaVerifier = useCallback((containerId = 'recaptcha-container') => {
    if (window.recaptchaVerifier) return window.recaptchaVerifier
    const verifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' })
    window.recaptchaVerifier = verifier
    return verifier
  }, [])

  const sendOtp = useCallback(async (e164Phone, containerId = 'recaptcha-container') => {
    const verifier = getRecaptchaVerifier(containerId)
    return signInWithPhoneNumber(auth, e164Phone, verifier)
  }, [getRecaptchaVerifier])

  const verifyOtp = useCallback(async (confirmationResult, code) => {
    const cred = await confirmationResult.confirm(code)
    return cred.user
  }, [])

  const value = useMemo(() => ({ 
    user, 
    loading, 
    role, 
    adminUserDoc,
    roleLoading, 
    adminUserStatus: adminUserDoc?.status || null,
    isRegisteredAdminUser: !!adminUserDoc && adminUserDoc.status === 'active',
    isSuperAdmin: normalizeEmail(user?.email) === SUPER_ADMIN_EMAIL,
    isStaffMember: (normalizeEmail(user?.email) === SUPER_ADMIN_EMAIL) || (adminUserDoc
      ? adminUserDoc.status === 'active'
      : (role?.isStaffMember || false)),
    isAdmin: (normalizeEmail(user?.email) === SUPER_ADMIN_EMAIL) || (adminUserDoc
      ? (adminUserDoc.status === 'active' && String(adminUserDoc.role || '').toLowerCase() === 'admin')
      : (role?.isAdmin || false)),
    isStaff: adminUserDoc
      ? (adminUserDoc.status === 'active' && String(adminUserDoc.role || '').toLowerCase() === 'staff')
      : (role?.isStaff || false),
    isDelivery: adminUserDoc
      ? (adminUserDoc.status === 'active' && String(adminUserDoc.role || '').toLowerCase() === 'delivery')
      : (role?.isDelivery || false),
    isCashManager: adminUserDoc
      ? (adminUserDoc.status === 'active' && String(adminUserDoc.role || '').toLowerCase() === 'staff' && !!adminUserDoc.pages?.cashManager)
      : (String(role?.role || '').toLowerCase() === 'staff' && !!role?.pages?.cashManager),
    isOrderMessenger: adminUserDoc
      ? (adminUserDoc.status === 'active' && String(adminUserDoc.role || '').toLowerCase() === 'staff' && !!adminUserDoc.pages?.orderMessenger)
      : (String(role?.role || '').toLowerCase() === 'staff' && !!role?.pages?.orderMessenger),
    canAccess,
    refreshRole: () => refreshRole(user?.email, user?.uid),
    signup, 
    login, 
    logout, 
    loginWithGoogle, 
    sendOtp, 
    verifyOtp 
  }), [user, loading, role, adminUserDoc, roleLoading, canAccess, refreshRole, signup, login, logout, loginWithGoogle, sendOtp, verifyOtp])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
