// Firebase app initialization for admin portal
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

if (import.meta.env.DEV) {
  for (const [key, val] of Object.entries(firebaseConfig)) {
    if (!val) console.warn(`[firebase] Missing env for ${key}`)
  }
}

export const app = initializeApp(firebaseConfig)

// Initialize Firestore with explicit settings
export const db = getFirestore(app)

// Initialize Auth
export const auth = getAuth(app)

// Uncomment below to use emulators in development
// if (import.meta.env.DEV && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
//   try {
//     connectFirestoreEmulator(db, 'localhost', 8080)
//     connectAuthEmulator(auth, 'http://localhost:9099')
//   } catch (e) {
//     console.warn('[firebase] Emulator connection failed:', e)
//   }
// }
