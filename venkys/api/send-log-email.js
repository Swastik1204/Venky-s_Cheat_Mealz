/* eslint-env node */
// Email notification API for log events
// POST body: { type: string, message: string, metadata: object }
// Uses Nodemailer with Gmail SMTP (free, unlimited)
// Requires env: EMAIL_USER (Gmail address), EMAIL_PASS (Gmail App Password)

import { createRateLimiter } from './lib/rateLimiter.js'
import { verifyAuth, verifyInternalSecret } from './lib/verifyAuth.js'
import { handleCors } from './lib/cors.js'
import nodemailer from 'nodemailer'

const rateLimiter = createRateLimiter({ routeName: 'send-log-email' })

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
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    
    const emailBody = `
<h2>🔔 New Log Entry</h2>
<p><strong>Type:</strong> ${esc(type)}</p>
<p><strong>Time:</strong> ${timestamp} IST</p>
<p><strong>Message:</strong></p>
<pre>${esc(message)}</pre>
${metadataStr ? `<p><strong>Details:</strong></p><pre>${esc(metadataStr)}</pre>` : ''}
<hr>
<p style="color: #666; font-size: 12px;">Sent from Venky's Cheat Mealz monitoring system</p>
    `.trim()

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
      from: `"Venky's Logs" <${emailUser}>`,
      to: emailRecipient,
      subject: `${testPrefix}[${type.toUpperCase()}] Log Alert - ${message.substring(0, 50)}`,
      html: emailBody,
    })

    return res.status(200).json({ ok: true, messageId: info.messageId })
  } catch (error) {
    console.error('Email send error:', error)
    return res.status(500).json({ error: 'Failed to send email' })
  }
}
