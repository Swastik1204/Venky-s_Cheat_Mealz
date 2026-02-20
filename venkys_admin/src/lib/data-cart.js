// Cart persistence (admin — simplified, no loadCart needed)
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export async function saveCart(uid, cartItems) {
  if (!uid) return
  try {
    const ref = doc(db, 'users', uid, 'meta', 'cart')
    await setDoc(ref, { items: cartItems, updatedAt: serverTimestamp() }, { merge: true })
  } catch (e) {
    console.warn('saveCart failed', e)
  }
}
