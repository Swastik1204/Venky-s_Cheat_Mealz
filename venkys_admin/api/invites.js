/* eslint-env node */
// Vercel Serverless Function: staff invite flow (create/verify/redeem/revoke)
// Endpoint: /api/invites
// Method: POST
// Body: { action: 'create' | 'verify' | 'redeem' | 'revoke', ...actionFields }
//
// Consolidated from 4 separate files (create-invite.js, verify-invite.js,
// redeem-invite.js, revoke-invite.js) into one to stay under Vercel's Hobby
// plan 12-serverless-function cap — venkys_admin/api/ had grown to 15
// top-level files, which started failing production deploys. Each action's
// logic and auth requirements are unchanged from the original files, just
// routed by `action` instead of by URL path.
//
// create: Auth: admin/superadmin only (isAdminEmail). Body: { action:
//   'create', email, role, pages?, defaultPage? }. Returns: { ok: true,
//   token, expiresAt }. The invite doc captures the FULL staff config
//   (role/pages/defaultPage) at invite time — the invitee doesn't choose
//   their own permissions, they just prove they own the invited inbox.
//   redeem writes this exact config to roles/{email} once claimed. If the
//   email already has a roles/{email} doc, this is BLOCKED (not
//   overwritten) — an invite is an onboarding path for a NEW staff member.
//
// verify: Auth: none — powers the public /claim page's initial state,
//   before the invitee has signed in. Body: { action: 'verify', token }.
//   Returns: { valid: true, email, role } or { valid: false, reason }.
//   reason: 'no_token' | 'not_found' | 'claimed' | 'revoked' | 'expired'.
//
// redeem: Auth: any signed-in Firebase user (NOT staff yet — that's the
//   whole point: this is how a brand-new user becomes staff). Body:
//   { action: 'redeem', token }. Returns: { ok: true, role }. Writes
//   roles/{email} via the Admin SDK (bypasses firestore.rules, same
//   "server-owned write" pattern as /api/place-order) using EXACTLY the
//   role/pages/defaultPage captured at invite time.
//
// revoke: Auth: admin/superadmin only. Body: { action: 'revoke', token }.
//   Returns: { ok: true }.

import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyAuth } from './_lib/verifyAuth.js'
import { handleCors } from './_lib/cors.js'
import { adminDb, isAdminEmail, FieldValue } from './_lib/fcm.js'

// Kept per-action rate limits distinct (not one shared 'invites' limiter) —
// these 4 actions have very different risk profiles: 'redeem' is sensitive
// (creates a roles/{email} doc) and stays tight at 5/hour, while 'verify' is
// public/unauthenticated and stays looser at 20/hour. Route names unchanged
// from the original 4 separate endpoints, only how they're dispatched changed.
const rateLimiters = {
  create: createRateLimiter({ routeName: 'create-invite' }),
  verify: createRateLimiter({ routeName: 'verify-invite' }),
  redeem: createRateLimiter({ routeName: 'redeem-invite' }),
  revoke: createRateLimiter({ routeName: 'revoke-invite' }),
}
const VALID_ROLES = ['admin', 'staff', 'delivery']
const INVITE_TTL_MS = 48 * 60 * 60 * 1000 // 48 hours

function normalizeRolePages(pages) {
  if (!pages || typeof pages !== 'object') return null
  const out = {}
  for (const [k, v] of Object.entries(pages)) out[k] = !!v
  return out
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function buildInviteEmailHtml({ inviteUrl, role, invitedByName, expiresAt }) {
  const expiresText = expiresAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
  return `
<div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #1f2937; max-width: 560px;">
  <h2 style="margin: 0 0 4px;">You're invited to join Venky's staff</h2>
  <p style="color: #6b7280; margin: 0 0 20px; font-size: 13px;">Sent by ${esc(invitedByName)}</p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="padding: 4px 0; color: #6b7280; width: 90px; vertical-align: top;">What</td>
      <td style="padding: 4px 0;">${esc(invitedByName)} added you to the Venky's admin panel as <strong>${esc(role)}</strong>.</td>
    </tr>
    <tr>
      <td style="padding: 4px 0; color: #6b7280; vertical-align: top;">Expires</td>
      <td style="padding: 4px 0;">${esc(expiresText)} IST — after that you'll need a fresh invite.</td>
    </tr>
  </table>

  <div style="margin: 24px 0;">
    <a href="${inviteUrl}" style="display: inline-block; background: #f59e0b; color: #1f2937; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
      Activate my access
    </a>
  </div>

  <p style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 10px 14px; margin: 0 0 20px; font-size: 14px;">
    <strong>Why it matters:</strong> This link only works when you sign in with the email address it was sent to. If you weren't expecting this, you can safely ignore it — nothing happens until the link is opened and confirmed.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
  <p style="color: #9ca3af; font-size: 11px;">Sent from Venky's Cheat Mealz staff onboarding</p>
</div>
  `.trim()
}

async function handleCreate(req, res) {
  const auth = await verifyAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  const callerEmail = String(auth.user?.email || '').trim()
  if (!(await isAdminEmail(callerEmail))) {
    return res.status(403).json({ error: 'Admin access required to invite staff' })
  }

  const body = req.body || {}
  const email = String(body.email || '').trim().toLowerCase()
  const role = String(body.role || '').trim().toLowerCase()

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' })
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` })
  }

  const db = adminDb()

  const existingRole = await db.collection('roles').doc(email).get()
  if (existingRole.exists) {
    return res.status(409).json({ error: 'This person already has access. Remove their existing role first if you want to re-invite them.' })
  }

  const existingInvites = await db.collection('staffInvites')
    .where('email', '==', email)
    .where('status', '==', 'pending')
    .limit(1)
    .get()
  if (!existingInvites.empty) {
    return res.status(409).json({ error: 'A pending invite already exists for this email' })
  }

  const token = crypto.randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + INVITE_TTL_MS)
  const pages = role === 'admin' ? null : normalizeRolePages(body.pages)
  const defaultPage = role !== 'admin' && typeof body.defaultPage === 'string' && body.defaultPage ? body.defaultPage : null

  await db.collection('staffInvites').doc(token).set({
    email,
    role,
    pages,
    defaultPage,
    invitedBy: callerEmail,
    invitedByName: auth.user?.name || callerEmail,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
    status: 'pending',
  })

  const appOrigin = (process.env.ADMIN_APP_URL || 'https://venkys-admin.web.app').replace(/\/$/, '')
  const inviteUrl = `${appOrigin}/claim?token=${token}`

  const emailUser = (process.env.EMAIL_USER || '').trim()
  const emailPass = (process.env.EMAIL_PASS || '').trim()
  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: emailUser, pass: emailPass } })
      await transporter.sendMail({
        from: `"Venky's Staff" <${emailUser}>`,
        to: email,
        subject: "You're invited to join Venky's staff",
        html: buildInviteEmailHtml({ inviteUrl, role, invitedByName: auth.user?.name || callerEmail, expiresAt }),
      })
    } catch (emailErr) {
      console.error('[invites:create] Email send failed (invite still created):', emailErr)
    }
  } else {
    console.warn('[invites:create] EMAIL_USER/EMAIL_PASS not configured — invite created but no email sent')
  }

  await db.collection('logs').add({
    action: 'create',
    collection: 'staffInvites',
    documentId: email,
    performedBy: callerEmail,
    readableAction: `${callerEmail} invited ${email} as ${role}`,
    metadata: { role, invitedFor: email },
    timestamp: FieldValue.serverTimestamp(),
  })

  return res.status(200).json({ ok: true, token, expiresAt: expiresAt.toISOString() })
}

async function handleVerify(req, res) {
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
}

async function handleRedeem(req, res) {
  const auth = await verifyAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })
  if (!auth.user?.uid) {
    return res.status(401).json({ error: 'Please sign in before claiming an invite.' })
  }

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
}

async function handleRevoke(req, res) {
  const auth = await verifyAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  const callerEmail = String(auth.user?.email || '').trim()
  if (!(await isAdminEmail(callerEmail))) {
    return res.status(403).json({ error: 'Admin access required to revoke invites' })
  }

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
}

const ACTION_HANDLERS = {
  create: handleCreate,
  verify: handleVerify,
  redeem: handleRedeem,
  revoke: handleRevoke,
}

export default async function handler(req, res) {
  if (handleCors(req, res, 'POST, OPTIONS')) return
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const action = String((req.body || {}).action || '').trim().toLowerCase()
  const actionHandler = ACTION_HANDLERS[action]
  if (!actionHandler) {
    return res.status(400).json({ error: `Invalid or missing action. Must be one of: ${Object.keys(ACTION_HANDLERS).join(', ')}` })
  }

  await rateLimiters[action](req, res, () => {})
  if (res.headersSent) return

  try {
    return await actionHandler(req, res)
  } catch (error) {
    console.error(`[invites:${action}] error`, error)
    if (!res.headersSent) return res.status(500).json({ error: 'Request failed' })
  }
}
