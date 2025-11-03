import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { auth } from '../lib/firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { ensureUserDocument } from '../lib/userData'
import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setError(null)
      setUser(firebaseUser)
      setLoading(false)
      if (firebaseUser) {
        // Ensure a users/{uid} document exists
        try {
          await ensureUserDocument(firebaseUser)
        } catch (e) {
          console.warn('Failed to ensure user doc:', e)
        }
      }
    })
    return () => unsub()
  }, [])

  const signup = useCallback(async (email, password, displayName) => {
    setError(null)
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(cred.user, { displayName })
    }
    await ensureUserDocument(cred.user)
    return cred.user
  }, [])

  const login = useCallback(async (email, password) => {
    setError(null)
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  // Google sign-in
  const loginWithGoogle = useCallback(async () => {
    setError(null)
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    return cred.user
  }, [])

  // Phone OTP helpers
  const getRecaptchaVerifier = useCallback((containerId = 'recaptcha-container') => {
    // Reuse if exists
    const anyWin = window
    if (anyWin.recaptchaVerifier) return anyWin.recaptchaVerifier
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
    })
    anyWin.recaptchaVerifier = verifier
    return verifier
  }, [])

  const sendOtp = useCallback(async (e164Phone, containerId = 'recaptcha-container') => {
    setError(null)
    const verifier = getRecaptchaVerifier(containerId)
    return signInWithPhoneNumber(auth, e164Phone, verifier)
  }, [getRecaptchaVerifier])

  const verifyOtp = useCallback(async (confirmationResult, code) => {
    setError(null)
    const cred = await confirmationResult.confirm(code)
    return cred.user
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    error,
    signup,
    login,
    logout,
    loginWithGoogle,
    sendOtp,
    verifyOtp,
  }), [user, loading, error, signup, login, logout, loginWithGoogle, sendOtp, verifyOtp])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
