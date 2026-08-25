/* eslint-env node */
/**
 * Shared FCM send helpers for Vercel serverless API routes.
 *
 * Token storage (fcmTokens/{uid}):
 *   Staff (Flutter admin_control app): { token, uid, email, updatedAt }
 *   Customers (venkys web app):        { token, uid, kind: 'customer', updatedAt }
 * Staff multicast excludes docs with kind === 'customer'.
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

function ensureAdmin() {
  if (getApps().length) return
  const sa = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim()
  if (sa) {
    try { initializeApp({ credential: cert(JSON.parse(sa)) }) } catch { initializeApp() }
  } else {
    initializeApp()
  }
}

export function adminDb() {
  ensureAdmin()
  return getFirestore()
}

export { FieldValue }

function stringifyData(data = {}) {
  const out = {}
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue
    out[k] = String(v)
  }
  return out
}

/**
 * Send a push to a single user's registered device.
 * Silently skips (returns { skipped: true }) when the user has no token doc —
 * not every customer grants notification permission.
 */
export async function sendFCMToUser(uid, { title, body, data = {} }) {
  if (!uid) return { skipped: true, reason: 'no-uid' }
  ensureAdmin()
  const db = getFirestore()
  const tokenSnap = await db.collection('fcmTokens').doc(uid).get()
  const token = tokenSnap.exists ? tokenSnap.data()?.token : null
  if (!token) return { skipped: true, reason: 'no-token' }

  const message = {
    token,
    notification: { title, body },
    data: stringifyData(data),
    android: {
      priority: 'high',
      notification: { sound: 'default', defaultSound: true },
    },
    webpush: data.url ? { fcmOptions: { link: String(data.url) } } : undefined,
  }

  try {
    await getMessaging().send(message)
    console.info(`[FCM] User push sent uid=${uid}`)
    return { sent: true }
  } catch (err) {
    const code = err?.errorInfo?.code || err?.code || ''
    if (String(code).includes('registration-token-not-registered')) {
      // Stale token — clean it up so future sends skip cheaply
      try { await db.collection('fcmTokens').doc(uid).delete() } catch { /* noop */ }
      console.info(`[FCM] Removed stale token for uid=${uid}`)
      return { skipped: true, reason: 'stale-token' }
    }
    console.error(`[FCM] User push failed uid=${uid}:`, err?.message || err)
    return { error: err?.message || 'send-failed' }
  }
}

/**
 * Multicast a push to all staff devices (every fcmTokens doc that is not
 * a customer registration). Per-token failures never abort the batch.
 */
export async function sendFCMToStaff({ title, body, data = {} }) {
  ensureAdmin()
  const db = getFirestore()
  const tokensSnap = await db.collection('fcmTokens').get()
  const staffDocs = tokensSnap.docs.filter((d) => d.data()?.kind !== 'customer')
  const tokens = staffDocs.map((d) => d.data()?.token).filter(Boolean)
  if (!tokens.length) {
    console.info('[FCM] No staff tokens registered')
    return { skipped: true, reason: 'no-tokens' }
  }

  const message = {
    tokens,
    notification: { title, body },
    data: stringifyData(data),
    android: {
      priority: 'high',
      notification: { sound: 'default', defaultSound: true },
    },
  }

  try {
    const response = await getMessaging().sendEachForMulticast(message)
    console.info('[FCM] Staff push:', response.successCount, 'sent,', response.failureCount, 'failed')
    if (response.failureCount > 0) {
      response.responses.forEach(async (r, i) => {
        if (!r.success) {
          const errCode = String(r.error?.code || r.error?.message || '')
          console.error(`[FCM] Staff token ${i} failed:`, errCode)
          if (errCode.includes('registration-token-not-registered') || errCode.includes('invalid-registration-token')) {
            const staleDoc = staffDocs[i]
            if (staleDoc) {
              try {
                await db.collection('fcmTokens').doc(staleDoc.id).delete()
                console.info(`[FCM] Auto-removed stale staff token doc=${staleDoc.id}`)
              } catch { /* noop */ }
            }
          }
        }
      })
    }
    return { sent: response.successCount, failed: response.failureCount }
  } catch (err) {
    console.error('[FCM] Staff multicast failed:', err?.message || err)
    return { error: err?.message || 'send-failed' }
  }
}

const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'swastiksaha1204@gmail.com').trim().toLowerCase()

/** True when the authenticated email belongs to a staff/admin role. */
export async function isStaffEmail(email) {
  if (!email) return false
  if (String(email).trim().toLowerCase() === SUPER_ADMIN_EMAIL) return true // super admin (mirrors firestore.rules)
  ensureAdmin()
  try {
    const roleSnap = await getFirestore().collection('roles').doc(email).get()
    return roleSnap.exists
  } catch {
    return false
  }
}

/**
 * Server-side mirror of firestore.rules' canAccess(pageKey): admin/superadmin
 * always pass; a plain staff role passes only if it holds that specific page
 * permission. Used to gate server endpoints the same way rules gate direct
 * Firestore writes, so an endpoint can't grant more than the rules would.
 */
export async function canAccess(email, pageKey) {
  if (!email) return false
  if (String(email).trim().toLowerCase() === SUPER_ADMIN_EMAIL) return true // super admin bypass, mirrors firestore.rules
  ensureAdmin()
  try {
    const roleSnap = await getFirestore().collection('roles').doc(email).get()
    if (!roleSnap.exists) return false
    const data = roleSnap.data() || {}
    const role = String(data.role || '').toLowerCase()
    if (role === 'admin') return true // admin bypasses granular perms, mirrors firestore.rules isAdmin()
    if (role !== 'staff') return false
    const pages = data.pages && typeof data.pages === 'object' ? data.pages : {}
    return pages[pageKey] === true
  } catch {
    return false
  }
}
