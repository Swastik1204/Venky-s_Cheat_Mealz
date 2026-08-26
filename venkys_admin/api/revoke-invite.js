/* eslint-env node */
// Vercel Serverless Function: revoke a pending staff invite
// Endpoint: /api/revoke-invite
// Method: POST
// Auth: admin/superadmin only
// Body: { token }
// Returns: { ok: true }

import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyAuth } from './_lib/verifyAuth.js'
import { handleCors } from './_lib/cors.js'
import { adminDb, isAdminEmail, FieldValue } from './_lib/fcm.js'

const rateLimiter = createRateLimiter({ routeName: 'revoke-invite' })

export default async function handler(req, res) {
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return

  if (handleCors(req, res, 'POST, OPTIONS')) return
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = await verifyAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  const callerEmail = String(auth.user?.email || '').trim()
  if (!(await isAdminEmail(callerEmail))) {
    return res.status(403).json({ error: 'Admin access required to revoke invites' })
  }

  try {
    const { token } = req.body || {}
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Missing token' })
    }

    const db = adminDb()
    const inviteRef = db.collection('staffInvites').doc(token)
    const snap = await inviteRef.get()
    if (!snap.exists) {
      return res.status(404).json({ error: 'Invite not found' })
    }
    const invite = snap.data()
    if (invite.status !== 'pending') {
      return res.status(400).json({ error: `Invite is already ${invite.status}` })
    }

    await inviteRef.update({
      status: 'revoked',
      revokedAt: FieldValue.serverTimestamp(),
      revokedBy: callerEmail,
    })

    await db.collection('logs').add({
      action: 'update',
      collection: 'staffInvites',
      documentId: invite.email,
      performedBy: callerEmail,
      readableAction: `${callerEmail} revoked the pending invite for ${invite.email}`,
      metadata: { role: invite.role },
      timestamp: FieldValue.serverTimestamp(),
    })

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('[revoke-invite] error', error)
    return res.status(500).json({ error: 'Failed to revoke invite' })
  }
}
