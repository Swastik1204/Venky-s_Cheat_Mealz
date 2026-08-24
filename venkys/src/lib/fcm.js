// fcm — Customer push notification registration and foreground handling
// Tokens are stored in fcmTokens/{uid} with kind: 'customer' so staff-facing
// multicast sends (which target the same collection) can exclude customers.
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'

import { app, db } from './firebase'

let messagingInstance = null
let supportChecked = false
let supported = false

async function getMessagingIfSupported() {
  if (!supportChecked) {
    supportChecked = true
    try {
      supported = typeof window !== 'undefined'
        && 'Notification' in window
        && 'serviceWorker' in navigator
        && await isSupported()
    } catch {
      supported = false
    }
  }
  if (!supported) return null
  if (!messagingInstance) messagingInstance = getMessaging(app)
  return messagingInstance
}

export function getNotificationPermission() {
  return typeof Notification !== 'undefined' ? Notification.permission : 'denied'
}

/**
 * Register this device's FCM token under fcmTokens/{uid}.
 * - Never prompts unless requestPermission is true (call it from a user gesture).
 * - Returns the token string, or null when unsupported/denied/unconfigured.
 */
export async function registerFcmToken(uid, { requestPermission = false } = {}) {
  if (!uid) return null
  const messaging = await getMessagingIfSupported()
  if (!messaging) return null

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    console.warn('[FCM] VITE_FIREBASE_VAPID_KEY is not set - push registration skipped')
    return null
  }

  let permission = Notification.permission
  if (permission === 'default' && requestPermission) {
    try { permission = await Notification.requestPermission() } catch { permission = 'denied' }
  }
  if (permission !== 'granted') return null

  // Reuse the app's existing service worker (src/sw.js handles 'push' events);
  // registering firebase-messaging-sw.js separately would conflict at root scope.
  let swRegistration
  try {
    swRegistration = await navigator.serviceWorker.ready
  } catch {
    return null
  }

  try {
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swRegistration })
    if (!token) return null
    await setDoc(doc(db, 'fcmTokens', uid), {
      token,
      uid,
      kind: 'customer',
      updatedAt: serverTimestamp(),
    })
    return token
  } catch (err) {
    console.warn('[FCM] Token registration failed:', err?.message || err)
    return null
  }
}

/** Remove this user's token (e.g. on logout). Best-effort. */
export async function unregisterFcmToken(uid) {
  if (!uid) return
  try { await deleteDoc(doc(db, 'fcmTokens', uid)) } catch { /* best-effort */ }
}

/**
 * Subscribe to foreground FCM messages. Foreground messages do NOT display
 * as OS notifications, so the callback must surface them in-app (toast).
 * Returns an unsubscribe function.
 */
export async function listenForegroundMessages(callback) {
  const messaging = await getMessagingIfSupported()
  if (!messaging) return () => {}
  return onMessage(messaging, (payload) => {
    try { callback(payload) } catch { /* noop */ }
  })
}
