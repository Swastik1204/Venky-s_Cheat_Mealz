/* eslint-env node */
// Email notification API for log events
// POST body: { type: string, message: string, metadata: object }
// Uses Nodemailer with Gmail SMTP (free, unlimited)
// Requires env: EMAIL_USER (Gmail address), EMAIL_PASS (Gmail App Password)

import { createRateLimiter } from './_lib/rateLimiter.js'
import { verifyAuth, verifyInternalSecret } from './_lib/verifyAuth.js'
import { handleCors } from './_lib/cors.js'
import nodemailer from 'nodemailer'

const rateLimiter = createRateLimiter({ routeName: 'send-log-email' })

// type -> { title, why } for the friendly, non-technical framing.
// type is usually `${collection}_${action}` from auditLog.js (e.g.
// 'roles_create') or a fixed string from the rate limiter / other server
// code (e.g. 'rate_limit_violation'). Falls back to a generic framing for
// any type not listed here so a new event type never breaks the email.
const EVENT_INFO = {
  rate_limit_violation: {
    title: 'Unusual amount of traffic',
    why: 'Someone (or something) is hitting the ordering system faster than normal. Usually harmless — but if you keep getting this, it could be a bot or someone testing the app.',
  },
  roles_create: {
    title: 'New staff member added',
    why: 'This person can now sign in to the admin panel with whatever access they were given.',
  },
  roles_delete: {
    title: 'Staff member removed',
    why: 'This person can no longer sign in to the admin panel.',
  },
  roles_update: {
    title: 'Staff permissions changed',
    why: "Someone's access to admin pages was changed. Worth a glance if you didn't make this change yourself.",
  },
  miscellaneous_update: {
    title: 'Store settings changed',
    why: 'This can affect delivery pricing, store hours, or how the app behaves for customers.',
  },
  stock_low_alert: {
    title: 'Stock running low',
    why: 'An ingredient is close to running out — you may want to reorder soon.',
  },
  orders_update: {
    title: 'Order cancelled or rejected',
    why: "An order didn't go through as normal. Worth checking why, especially if this keeps happening.",
  },
}

function eventInfo(type) {
  return EVENT_INFO[type] || {
    title: 'System alert',
    why: 'Something happened that the system thought you should know about.',
  }
}

function subjectFor(type) {
  return `🔔 ${eventInfo(type).title}`
}

// "orderId" -> "Order Id" for plain-language field labels in the changed-fields list.
function prettyFieldName(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
}

function formatValue(v) {
  if (v === null || v === undefined || v === '') return '(empty)'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

// Renders metadata.changedFields ({ field: { from, to } }) as a plain-English
// bullet list when present — this is the shape logChange()/getChangedFields()
// in venkys_admin/src/lib/auditLog.js produce, so most staff/settings/order
// alerts have it. Falls back to null if the shape doesn't match.
function renderChangedFields(metadata, esc) {
  const changed = metadata && typeof metadata === 'object' ? metadata.changedFields : null
  if (!changed || typeof changed !== 'object' || Array.isArray(changed)) return null
  const entries = Object.entries(changed).filter(([, v]) => v && typeof v === 'object' && ('from' in v || 'to' in v))
  if (entries.length === 0) return null
  const items = entries
    .map(([field, { from, to }]) => `<li><strong>${esc(prettyFieldName(field))}:</strong> ${esc(formatValue(from))} &rarr; ${esc(formatValue(to))}</li>`)
    .join('')
  return `<ul style="margin: 8px 0 0; padding-left: 20px;">${items}</ul>`
}

function buildLogEmailHtml({ type, message, metadata, esc, timestamp, metadataStr }) {
  const info = eventInfo(type)
  const who = (metadata && (metadata.performedBy || metadata.actor)) || 'the system'
  const changedFieldsHtml = renderChangedFields(metadata, esc)

  return `
<div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #1f2937; max-width: 560px;">
  <h2 style="margin: 0 0 4px;">${esc(info.title)}</h2>
  <p style="color: #6b7280; margin: 0 0 20px; font-size: 13px;">${esc(timestamp)} IST</p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
    <tr>
      <td style="padding: 4px 0; color: #6b7280; width: 90px; vertical-align: top;">What</td>
      <td style="padding: 4px 0;">${esc(message)}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0; color: #6b7280; vertical-align: top;">Who</td>
      <td style="padding: 4px 0;">${esc(who)}</td>
    </tr>
  </table>

  ${changedFieldsHtml ? `<p style="margin: 0 0 4px;"><strong>What changed</strong></p>${changedFieldsHtml}<div style="margin-bottom: 16px;"></div>` : ''}

  <p style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 10px 14px; margin: 0 0 20px; font-size: 14px;">
    <strong>Why it matters:</strong> ${esc(info.why)}
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

  <details>
    <summary style="cursor: pointer; color: #6b7280; font-size: 12px;">Technical details (for developer use)</summary>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-top: 8px; font-size: 12px; color: #374151;">
      <p style="margin: 0 0 6px;"><strong>type:</strong> ${esc(type)}</p>
      ${metadataStr ? `<pre style="white-space: pre-wrap; word-break: break-word; margin: 0;">${esc(metadataStr)}</pre>` : '<p style="margin:0; color:#9ca3af;">(no metadata)</p>'}
    </div>
  </details>

  <p style="color: #9ca3af; font-size: 11px; margin-top: 24px;">Sent from Venky's Cheat Mealz monitoring system</p>
</div>
  `.trim()
}

export default async function handler(req, res) {
  // Apply rate limiting (20 emails per minute max to avoid spam)
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return

  if (handleCors(req, res, 'POST, OPTIONS')) return
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  // Accept either Firebase Auth or internal API secret (for server-to-server calls)
  const isInternal = verifyInternalSecret(req)
  if (!isInternal) {
    const auth = await verifyAuth(req)
    if (auth.error) return res.status(auth.status).json({ error: auth.error })
  }

  const emailUser = (process.env.EMAIL_USER || '').trim()
  const emailPass = (process.env.EMAIL_PASS || '').trim()
  const emailRecipient = (process.env.LOG_EMAIL_RECIPIENT || '').trim()
  if (!emailUser || !emailPass || !emailRecipient) {
    console.error('[send-log-email] Missing email config - logs will not be sent')
    return res.status(500).json({ error: 'Email not configured' })
  }

  try {
    const { type, message, metadata } = req.body || {}
    
    if (!type || !message) {
      return res.status(400).json({ error: 'missing_required_fields' })
    }

    // Sanitize inputs to prevent XSS in HTML emails
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    // Enforce payload size limits
    if (String(message).length > 5000) {
      return res.status(400).json({ error: 'message_too_long', maxLength: 5000 })
    }
    const metadataStr = metadata ? JSON.stringify(metadata, null, 2) : ''
    if (metadataStr.length > 10000) {
      return res.status(400).json({ error: 'metadata_too_large', maxLength: 10000 })
    }

    // Format email body
    const now = new Date()
    const timestamp = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    const emailBody = buildLogEmailHtml({ type, message, metadata, esc, timestamp, metadataStr })

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })

    // Send email
    const testPrefix = process.env.NODE_ENV !== 'production' ? '[TEST] ' : ''
    const info = await transporter.sendMail({
      from: `"Venky's Alerts" <${emailUser}>`,
      to: emailRecipient,
      subject: `${testPrefix}${subjectFor(type)} — ${message.substring(0, 60)}`,
      html: emailBody,
    })

    return res.status(200).json({ ok: true, messageId: info.messageId })
  } catch (error) {
    console.error('Email send error:', error)
    return res.status(500).json({ error: 'Failed to send email' })
  }
}
