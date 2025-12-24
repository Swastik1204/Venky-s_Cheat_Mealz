// Firestore helpers for users collection
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
    // Optionally update last seen
    // await updateDoc(ref, { updatedAt: serverTimestamp() })
  }
}

export function getAvatarUrl(userOrProfile) {
  if (userOrProfile?.photoURL) return userOrProfile.photoURL
  const seed = userOrProfile?.displayName || userOrProfile?.name || userOrProfile?.email || 'User'
  // Use DiceBear Avataaars
  // We can try to influence gender if available, but for now just seed is robust
  let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
  
  if (userOrProfile?.gender) {
    const g = userOrProfile.gender.toLowerCase()
    if (g === 'male') {
      // Prefer short hair / facial hair
      url += `&top[]=shortHair&top[]=shortHairDreads&top[]=shortHairFrizzle&top[]=shortHairShaggy&top[]=shortHairSides&top[]=shortHairTheCaesar&facialHairProbability=50`
    } else if (g === 'female') {
      // Prefer long hair, no facial hair
      url += `&top[]=longHair&top[]=longHairBob&top[]=longHairBun&top[]=longHairCurly&top[]=longHairCurvy&top[]=longHairDreads&top[]=longHairFrida&top[]=longHairFro&top[]=longHairMiaWallace&top[]=longHairNotTooLong&top[]=longHairShavedSides&top[]=longHairStraight&top[]=longHairStraight2&top[]=longHairStraightStrand&facialHairProbability=0`
    }
  }
  
  return url
}
