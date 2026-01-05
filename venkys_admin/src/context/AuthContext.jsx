import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth, db } from '../lib/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null) // null | { isStaffMember, role, isAdmin }
  const [roleLoading, setRoleLoading] = useState(true)

  const canAccess = useCallback((pageKey) => {
    const roleName = role?.role
    if (!role?.isStaffMember || !roleName) return false
    if (roleName === 'admin') return true
    if (roleName === 'delivery') return pageKey === 'delivery'
    // Staff: prefer explicit pages permissions if present
    if (role?.pages && typeof role.pages === 'object') {
      return !!role.pages[pageKey]
    }
    // Back-compat defaults (existing installs)
    if (roleName === 'staff') {
      return ['orders', 'biller', 'inventory', 'stock', 'analytics'].includes(pageKey)
    }
    return false
  }, [role])

  // Check user role from /roles/{email} collection
  const refreshRole = useCallback(async (email) => {
    if (!email) {
      setRole(null)
      setRoleLoading(false)
      return
    }
    setRoleLoading(true)
    try {
      const roleRef = doc(db, 'roles', email.toLowerCase().trim())
      const roleSnap = await getDoc(roleRef)
      if (roleSnap.exists()) {
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

  async function signup(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) await updateProfile(cred.user, { displayName })
    await ensureUserDocument(cred.user)
    return cred.user
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }

  async function logout() {
    await signOut(auth)
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    return cred.user
  }

  function getRecaptchaVerifier(containerId = 'recaptcha-container') {
    if (window.recaptchaVerifier) return window.recaptchaVerifier
    const verifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' })
    window.recaptchaVerifier = verifier
    return verifier
  }

  async function sendOtp(e164Phone, containerId = 'recaptcha-container') {
    const verifier = getRecaptchaVerifier(containerId)
    return signInWithPhoneNumber(auth, e164Phone, verifier)
  }

  async function verifyOtp(confirmationResult, code) {
    const cred = await confirmationResult.confirm(code)
    return cred.user
  }

  const value = { 
    user, 
    loading, 
    role, 
    roleLoading, 
    // Helper booleans for easy access
    isStaffMember: role?.isStaffMember || false, // Has any role (admin or staff)
    isAdmin: role?.isAdmin || false,             // Is admin (full access)
    isStaff: role?.isStaff || false,             // Is staff (limited access)
		isDelivery: role?.isDelivery || false,
		canAccess,
    refreshRole: () => refreshRole(user?.email),
    signup, 
    login, 
    logout, 
    loginWithGoogle, 
    sendOtp, 
    verifyOtp 
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
