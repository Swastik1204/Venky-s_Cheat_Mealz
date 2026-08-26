// Firestore helpers for users collection
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function ensureUserDocument(user) {
  if (!user) return
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)

  // Always (re-)write identity fields via merge, regardless of whether the
  // doc already exists. This used to be an `if (!snap.exists())` create-only
  // branch — but setUserTheme()/saveCart() run in a separate, independent
  // effect off the same auth-state change and can create the doc first via
  // their own merge writes. When that race won, this function saw
  // snap.exists() === true and skipped writing email/displayName forever,
  // leaving a permanently identity-less profile doc (confirmed in
  // production: users/wIHjDJ1... — a real Google-signed-in account with only
  // a `theme` field). Writing identity fields unconditionally on every call
  // makes this idempotent and race-proof; createdAt is preserved/only set
  // once by only including it when the doc doesn't yet exist.
  await setDoc(ref, {
    displayName: user.displayName || '',
    email: user.email,
    phoneNumber: user.phoneNumber || '',
    ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}
