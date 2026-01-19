// Firestore helpers for ensuring admin user document exists
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function ensureUserDocument(user) {
  if (!user) return
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  const email = (typeof user.email === 'string' && user.email.trim()) ? user.email.trim() : null
  const emailLower = email ? email.toLowerCase() : null
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName || '',
      email,
      emailLower,
      photoURL: user.photoURL || '',
      phoneNumber: user.phoneNumber || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } else {
    try {
      await setDoc(ref, { updatedAt: serverTimestamp(), ...(emailLower ? { emailLower } : {}) }, { merge: true })
    } catch {
      // non-fatal bookkeeping failure
    }
  }
}
