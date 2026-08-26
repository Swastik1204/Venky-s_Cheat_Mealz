/* eslint-env node */
// Vercel Serverless Function: redeem a staff invite
// Endpoint: /api/redeem-invite
// Method: POST
// Auth: any signed-in Firebase user (NOT staff yet — that's the whole
// point: this endpoint is how a brand-new user becomes staff).
// Body: { token }
// Returns: { ok: true, role }
//
// Writes roles/{email} via the Admin SDK (bypasses firestore.rules, same
// "server-owned write" pattern as /api/place-order) using EXACTLY the
// role/pages/defaultPage captured at invite time — the invitee never
// chooses their own permissions here, they only prove inbox ownership by
// being signed in as that exact email.

import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyAuth } from './_lib/verifyAuth.js'
import { handleCors } from './_lib/cors.js'
import { adminDb, FieldValue } from './_lib/fcm.js'

const rateLimiter = createRateLimiter({ routeName: 'redeem-invite' })

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
  if (!auth.user?.uid) {
    return res.status(401).json({ error: 'Please sign in before claiming an invite.' })
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
      return res.status(400).json({ error: `This invite has already been ${invite.status}` })
    }

    const expiresAt = invite.expiresAt?.toDate ? invite.expiresAt.toDate() : new Date(invite.expiresAt)
    if (expiresAt < new Date()) {
      return res.status(400).json({ error: 'This invite has expired' })
    }

    const callerEmail = String(auth.user.email || '').trim().toLowerCase()
    if (callerEmail !== String(invite.email || '').toLowerCase()) {
      return res.status(403).json({ error: 'Signed-in email does not match the invited email', expectedEmail: invite.email })
    }

    // Re-check for a race: someone else could have been granted a roles doc
    // for this email between invite creation and redemption.
    const roleRef = db.collection('roles').doc(callerEmail)
    const existingRole = await roleRef.get()
    if (existingRole.exists) {
      return res.status(409).json({ error: 'This email already has access — contact an admin.' })
    }

    const roleData = {
      role: invite.role,
      name: auth.user.name || '',
      addedAt: FieldValue.serverTimestamp(),
      addedBy: invite.invitedBy || null,
    }
    if (invite.pages && typeof invite.pages === 'object') roleData.pages = invite.pages
    if (invite.defaultPage) roleData.defaultPage = invite.defaultPage

    await roleRef.set(roleData)
    await inviteRef.update({
      status: 'claimed',
      claimedAt: FieldValue.serverTimestamp(),
      claimedByUid: auth.user.uid,
    })

    await db.collection('logs').add({
      action: 'create',
      collection: 'roles',
      documentId: callerEmail,
      performedBy: callerEmail,
      readableAction: `${callerEmail} claimed their staff invite (${invite.role}, invited by ${invite.invitedBy || 'unknown'})`,
      metadata: { role: invite.role, invitedBy: invite.invitedBy || null },
      timestamp: FieldValue.serverTimestamp(),
    })

    return res.status(200).json({ ok: true, role: invite.role })
  } catch (error) {
    console.error('[redeem-invite] error', error)
    return res.status(500).json({ error: 'Failed to activate access' })
  }
}
