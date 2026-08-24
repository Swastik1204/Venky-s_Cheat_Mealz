/* eslint-env node */
/**
 * Firebase Auth verification middleware for Vercel serverless API routes.
 *
 * Usage in a handler:
 *   import { verifyAuth } from './lib/verifyAuth.js'
 *
 *   export default async function handler(req, res) {
 *     const auth = await verifyAuth(req)
 *     if (auth.error) return res.status(auth.status).json({ error: auth.error })
 *     // auth.user contains the decoded Firebase ID token
 *     ...
 *   }
 *
 * Requires env: FIREBASE_SERVICE_ACCOUNT (JSON string)
 *
 * Auth is mandatory by default. Set AUTH_REQUIRED=0 to disable (not recommended).
 * When mandatory, requests without a valid Bearer token are rejected with 401.
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Singleton Firebase Admin init
let _adminInitialized = false
function ensureAdmin() {
  if (_adminInitialized) return
  if (getApps().length) { _adminInitialized = true; return }
  const sa = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim()
  if (sa) {
    try {
      initializeApp({ credential: cert(JSON.parse(sa)) })
    } catch {
      initializeApp()
    }
  } else {
    initializeApp()
  }
  _adminInitialized = true
}

/**
 * Verify the Firebase ID token from the Authorization header.
 * @param {object} req - Vercel request object
 * @returns {{ user?: object, error?: string, status?: number }}
 */
export async function verifyAuth(req) {
  const authHeader = req.headers?.authorization || ''
  const isDisabled = process.env.AUTH_REQUIRED === '0' || process.env.AUTH_REQUIRED === 'false'
  if (process.env.AUTH_REQUIRED === '0') console.warn('[verifyAuth] WARNING: Auth is disabled via AUTH_REQUIRED=0 - do not use in production')
  const isMandatory = !isDisabled

  if (!authHeader.startsWith('Bearer ')) {
    if (isMandatory) {
      return { error: 'Authentication required', status: 401 }
    }
    // Best-effort: no token provided, allow through with no user
    return { user: null }
  }

  const token = authHeader.slice(7).trim()
  if (!token) {
    if (isMandatory) {
      return { error: 'Empty authentication token', status: 401 }
    }
    return { user: null }
  }

  try {
    ensureAdmin()
    const decoded = await getAuth().verifyIdToken(token)
    return { user: decoded }
  } catch (err) {
    // Token was provided but is invalid/expired
    console.error('[verifyAuth] Token verification error:', err)
    return { error: 'Invalid or expired authentication token', status: 401 }
  }
}

/**
 * Verify an internal API secret for server-to-server calls.
 * Used by endpoints called by other API routes (e.g. send-log-email from rate limiter).
 * @param {object} req - Vercel request object
 * @returns {boolean}
 */
export function verifyInternalSecret(req) {
  const secret = (process.env.API_INTERNAL_SECRET || '').trim()
  if (!secret) return false // not configured, deny internal calls
  const provided = (req.headers?.['x-internal-secret'] || '').trim()
  return provided.length > 0 && provided === secret
}
