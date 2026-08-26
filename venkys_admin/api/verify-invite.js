/* eslint-env node */
// Vercel Serverless Function: check a staff invite's state (public)
// Endpoint: /api/verify-invite
// Method: POST
// Auth: none — this powers the public /claim page's initial state, before
// the invitee has signed in.
// Body: { token }
// Returns: { valid: true, email, role } or { valid: false, reason }
// reason: 'no_token' | 'not_found' | 'claimed' | 'revoked' | 'expired'

import { createRateLimiter } from './_lib/rateLimiter.js'
import { handleCors } from './_lib/cors.js'
import { adminDb } from './_lib/fcm.js'

const rateLimiter = createRateLimiter({ routeName: 'verify-invite' })

export default async function handler(req, res) {
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return

  if (handleCors(req, res, 'POST, OPTIONS')) return
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { token } = req.body || {}
    if (!token || typeof token !== 'string') {
      return res.status(200).json({ valid: false, reason: 'no_token' })
    }

    const snap = await adminDb().collection('staffInvites').doc(token).get()
    if (!snap.exists) {
      return res.status(200).json({ valid: false, reason: 'not_found' })
    }

    const invite = snap.data()

    if (invite.status === 'claimed') {
      return res.status(200).json({ valid: false, reason: 'claimed' })
    }
    if (invite.status === 'revoked') {
      return res.status(200).json({ valid: false, reason: 'revoked' })
    }

    const expiresAt = invite.expiresAt?.toDate ? invite.expiresAt.toDate() : new Date(invite.expiresAt)
    if (expiresAt < new Date()) {
      return res.status(200).json({ valid: false, reason: 'expired' })
    }

    return res.status(200).json({
      valid: true,
      email: invite.email,
      role: invite.role,
      invitedByName: invite.invitedByName || 'an admin',
    })
  } catch (error) {
    console.error('[verify-invite] error', error)
    return res.status(500).json({ valid: false, reason: 'server_error' })
  }
}
