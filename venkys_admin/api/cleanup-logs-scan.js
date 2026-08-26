/* eslint-env node */
// Vercel Serverless Function: scan for old audit logs, propose them for
// cleanup, and email the super admin for review — never deletes anything
// itself. Weekly Vercel Cron (Sunday 3am) or manual trigger via
// X-Internal-Secret (for testing/on-demand runs).
// Endpoint: /api/cleanup-logs-scan
// Method: GET (matches sync-business-profile.js's cron pattern)

import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyInternalSecret } from './_lib/verifyAuth.js'
import { handleCors } from './_lib/cors.js'
import { adminDb, FieldValue } from './_lib/fcm.js'

const rateLimiter = createRateLimiter({ routeName: 'cleanup-logs-scan' })
const AGE_THRESHOLD_MS = 60 * 24 * 60 * 60 * 1000 // 2 months (60 days)
const MAX_CANDIDATES = 300 // keep the review page/email readable; a huge batch just means next week's run catches the rest
const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'swastiksaha1204@gmail.com').trim().toLowerCase()

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function formatTs(ts) {
  const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null)
  if (!d || Number.isNaN(d.getTime())) return 'unknown time'
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
}

function buildReviewEmailHtml({ count, reviewUrl, oldestLabel }) {
  return `
<div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #1f2937; max-width: 560px;">
  <h2 style="margin: 0 0 4px;">${count} old logs are ready for cleanup</h2>
  <p style="color: #6b7280; margin: 0 0 20px; font-size: 13px;">Weekly audit log review</p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="padding: 4px 0; color: #6b7280; width: 90px; vertical-align: top;">What</td>
      <td style="padding: 4px 0;">${count} audit log entries are older than 2 months and are candidates for deletion. Oldest entry: ${esc(oldestLabel)}.</td>
    </tr>
  </table>

  <div style="margin: 24px 0;">
    <a href="${reviewUrl}" style="display: inline-block; background: #f59e0b; color: #1f2937; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
      Review &amp; decide
    </a>
  </div>

  <p style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 10px 14px; margin: 0 0 20px; font-size: 14px;">
    <strong>Why it matters:</strong> Nothing is deleted automatically. Every entry is pre-selected on the review page, but you choose exactly what stays or goes before anything is removed.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
  <p style="color: #9ca3af; font-size: 11px;">Sent from Venky's Cheat Mealz log maintenance</p>
</div>
  `.trim()
}

export default async function handler(req, res) {
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return

  if (handleCors(req, res, 'GET, OPTIONS')) return
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const isCron = req.headers['x-vercel-cron'] === '1' || verifyInternalSecret(req)
  if (!isCron) {
    return res.status(403).json({ error: 'This endpoint only runs via Vercel Cron or an internal-secret trigger' })
  }

  try {
    const db = adminDb()
    const cutoff = new Date(Date.now() - AGE_THRESHOLD_MS)

    const oldLogsSnap = await db.collection('logs')
      .where('timestamp', '<', cutoff)
      .orderBy('timestamp', 'asc')
      .limit(MAX_CANDIDATES)
      .get()

    if (oldLogsSnap.empty) {
      return res.status(200).json({ ok: true, count: 0, message: 'No logs older than 2 months — nothing to review' })
    }

    // Supersede any still-pending batch from a previous run instead of
    // stacking confusing duplicate emails. The old candidate logs are still
    // >2 months old (nothing was deleted), so they simply reappear in this
    // fresh scan and get folded into the new token — no merge logic needed.
    const stalePending = await db.collection('pendingLogCleanup').where('status', '==', 'pending').get()
    if (!stalePending.empty) {
      const batch = db.batch()
      stalePending.docs.forEach((d) => batch.update(d.ref, { status: 'superseded', supersededAt: FieldValue.serverTimestamp() }))
      await batch.commit()
    }

    // Snapshot each candidate's human-readable summary now, at scan time —
    // the review page renders straight from this doc rather than
    // re-reading `logs` (avoids N+1 reads and a race if a log doc changes
    // or is otherwise removed between scan and review).
    const candidates = oldLogsSnap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        readableAction: data.readableAction || `${data.performedBy || data.userEmail || 'Someone'} made a change to ${data.collection || 'the system'}`,
        collection: data.collection || data.type || null,
        performedBy: data.performedBy || data.userEmail || null,
        timestampLabel: formatTs(data.timestamp),
        timestampMs: data.timestamp?.toDate ? data.timestamp.toDate().getTime() : null,
      }
    })

    const token = crypto.randomUUID()
    await db.collection('pendingLogCleanup').doc(token).set({
      logIds: candidates.map((c) => c.id),
      candidates,
      count: candidates.length,
      cutoffUsed: cutoff,
      createdAt: FieldValue.serverTimestamp(),
      status: 'pending',
      generatedBy: verifyInternalSecret(req) ? 'manual' : 'vercel_cron',
    })

    const appOrigin = (process.env.ADMIN_APP_URL || 'https://venkys-admin.web.app').replace(/\/$/, '')
    const reviewUrl = `${appOrigin}/admin/log-cleanup?token=${token}`

    const emailUser = (process.env.EMAIL_USER || '').trim()
    const emailPass = (process.env.EMAIL_PASS || '').trim()
    let emailSent = false
    if (emailUser && emailPass) {
      try {
        const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: emailUser, pass: emailPass } })
        await transporter.sendMail({
          from: `"Venky's Alerts" <${emailUser}>`,
          to: SUPER_ADMIN_EMAIL,
          subject: `🔔 ${candidates.length} old logs are ready for cleanup`,
          html: buildReviewEmailHtml({ count: candidates.length, reviewUrl, oldestLabel: candidates[0]?.timestampLabel || 'unknown' }),
        })
        emailSent = true
      } catch (emailErr) {
        console.error('[cleanup-logs-scan] Email send failed (batch still created):', emailErr)
      }
    } else {
      console.warn('[cleanup-logs-scan] EMAIL_USER/EMAIL_PASS not configured — batch created but no email sent')
    }

    return res.status(200).json({ ok: true, count: candidates.length, token, emailSent })
  } catch (error) {
    console.error('[cleanup-logs-scan] error', error)
    return res.status(500).json({ error: 'Failed to scan for old logs' })
  }
}
