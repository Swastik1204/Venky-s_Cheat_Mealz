// AuthContext — Firebase auth with role-based access control
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

import { auth, db } from '../lib/firebase'
import { ensureUserDocument } from '../lib/userData'

const AuthContext = createContext(null)

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

// canAccess(pageKey): always OR logic. isAdmin (which includes superadmin)
// short-circuits and bypasses every granular permission — admin/superadmin
// NEVER need to also hold the specific page permission a plain staff member
// would need. Do not rewrite this as "isStaff && hasPerm(...)" anywhere —
// that AND-logic inversion is the exact bug this model is designed to avoid.
function canAccessForRole(roleName, pages, pageKey) {
  const page = String(pageKey || '').trim().toLowerCase()
  const role = String(roleName || '').trim().toLowerCase()
  if (!role || !page) return false
  if (role === 'admin' || role === 'superadmin') return true
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
    logs: has('logs'),
  }

  return !!matrix[page]
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null) // null | { isStaffMember, role, isAdmin, ... }
  const [roleLoading, setRoleLoading] = useState(true)

  const canAccess = useCallback((pageKey) => {
    const page = String(pageKey || '').trim().toLowerCase()
    if (!role?.isStaffMember) return false
    if (role?.isSuperAdmin || role?.isAdmin) {
      return true
    }
    return canAccessForRole(role?.role, role?.pages, page)
  }, [role])

  // roles/{email} is the single source of truth for staff/admin access —
  // the legacy adminUsers/{uid} invite-based collection has been retired
  // (verified against live data: no account resolved only through it before
  // removal; every real staff/admin account already lived in roles).
  const refreshRole = useCallback(async (email) => {
    if (!email) {
      setRole(null)
      setRoleLoading(false)
      return
    }

    setRoleLoading(true)
    try {
      const roleSnap = await getDoc(doc(db, 'roles', normalizeEmail(email)))

      if (roleSnap.exists()) {
        const data = roleSnap.data()
        const userRole = String(data.role || 'staff').toLowerCase()
        const isSuperAdminRole = userRole === 'superadmin' || !!data.isSuperAdmin
        const isAdminRole = userRole === 'admin' || isSuperAdminRole

        setRole({
          isStaffMember: true,
          role: userRole,
          name: data.name || '',
          pages: data.pages && typeof data.pages === 'object' ? data.pages : null,
          defaultPage: data.defaultPage || null,
          isSuperAdmin: isSuperAdminRole || (isAdminRole && !!data.pages?.logs),
          isAdmin: isAdminRole,
          isStaff: userRole === 'staff',
          isDelivery: userRole === 'delivery',
        })
      } else {
        // No role document = no access
        setRole({ isStaffMember: false, role: null, isSuperAdmin: false, isAdmin: false, isStaff: false, isDelivery: false, pages: null, defaultPage: null, name: '' })
      }
    } catch (err) {
      console.error('[AuthContext] Role check failed:', err)
      setRole({ isStaffMember: false, role: null, isSuperAdmin: false, isAdmin: false, isStaff: false, isDelivery: false, pages: null, defaultPage: null, name: '' })
    } finally {
      setRoleLoading(false)
    }
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await refreshRole(firebaseUser.email)
      } else {
        setRole(null)
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
    roleLoading,
    isSuperAdmin: role?.isSuperAdmin || false,
    isStaffMember: role?.isStaffMember || false,
    isAdmin: role?.isAdmin || false,
    isStaff: role?.isStaff || false,
    isDelivery: role?.isDelivery || false,
    isCashManager: String(role?.role || '').toLowerCase() === 'staff' && !!role?.pages?.cashManager,
    isOrderMessenger: String(role?.role || '').toLowerCase() === 'staff' && !!role?.pages?.orderMessenger,
    canAccess,
    refreshRole: () => refreshRole(user?.email),
    signup,
    login,
    logout,
    loginWithGoogle,
    sendOtp,
    verifyOtp
  }), [user, loading, role, roleLoading, canAccess, refreshRole, signup, login, logout, loginWithGoogle, sendOtp, verifyOtp])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
