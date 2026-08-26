/* eslint-env node */
// Vercel Serverless Function: create a staff invite
// Endpoint: /api/create-invite
// Method: POST
// Auth: admin/superadmin only (isAdminEmail — mirrors the /roles/{email}
// write rule in firestore.rules, which is admin-only regardless of
// canAccess('settings')).
// Body: { email, role, pages?, defaultPage? }
// Returns: { ok: true, token, expiresAt }
//
// Design (per Part 5, confirmed): the invite doc captures the FULL staff
// config (role/pages/defaultPage) at invite time — the invitee doesn't
// choose their own permissions, they just prove they own the invited inbox.
// redeem-invite.js writes this exact config to roles/{email} once claimed.
//
// If the email already has a roles/{email} doc, this is BLOCKED (not
// overwritten) — an invite is an onboarding path for a NEW staff member,
// not a way to silently change an existing one's permissions. Editing an
// existing staff member's role/pages stays on the direct-write path
// (updateStaffMember in data-staff.js).

import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyAuth } from './_lib/verifyAuth.js'
import { handleCors } from './_lib/cors.js'
import { adminDb, isAdminEmail, FieldValue } from './_lib/fcm.js'

const rateLimiter = createRateLimiter({ routeName: 'create-invite' })
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
    return res.status(403).json({ error: 'Admin access required to invite staff' })
  }

  try {
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

    // Block if this email already has an active roles/{email} doc — invites
    // are for onboarding new staff, not silently changing an existing
    // member's access. Admin must remove the existing role first.
    const existingRole = await db.collection('roles').doc(email).get()
    if (existingRole.exists) {
      return res.status(409).json({ error: 'This person already has access. Remove their existing role first if you want to re-invite them.' })
    }

    // Dedupe: only one pending invite per email at a time.
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
        console.error('[create-invite] Email send failed (invite still created):', emailErr)
        // Don't fail the request — invite exists, link can be shared manually.
      }
    } else {
      console.warn('[create-invite] EMAIL_USER/EMAIL_PASS not configured — invite created but no email sent')
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
  } catch (error) {
    console.error('[create-invite] error', error)
    return res.status(500).json({ error: 'Failed to create invite' })
  }
}
