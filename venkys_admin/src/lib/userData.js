// Firestore helpers for ensuring admin user document exists
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function ensureUserDocument(user) {
  if (!user) return
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName || '',
      email: user.email,
      photoURL: user.photoURL || '',
      phoneNumber: user.phoneNumber || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } else {
    try {
      await setDoc(ref, { updatedAt: serverTimestamp() }, { merge: true })
    } catch {
      // non-fatal bookkeeping failure
    }
  }
}
