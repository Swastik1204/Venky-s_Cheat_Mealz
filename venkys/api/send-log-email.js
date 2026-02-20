/* eslint-env node */
// Email notification API for log events
// POST body: { type: string, message: string, metadata: object }
// Uses Nodemailer with Gmail SMTP (free, unlimited)
// Requires env: EMAIL_USER (Gmail address), EMAIL_PASS (Gmail App Password)

import { createRateLimiter } from './lib/rateLimiter.js'
import { verifyAuth, verifyInternalSecret } from './lib/verifyAuth.js'
import nodemailer from 'nodemailer'

const rateLimiter = createRateLimiter({ routeName: 'send-log-email' })

export default async function handler(req, res) {
  // Apply rate limiting (20 emails per minute max to avoid spam)
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return

  // CORS - restrict to configured origins
  const allow = process.env.CORS_ORIGIN || ''
  const origin = req.headers?.origin || ''
  let allowOrigin = origin || '*'
  if (allow && allow !== '*') {
    const list = allow.split(',').map(s => s.trim()).filter(Boolean)
    allowOrigin = list.includes(origin) ? origin : list[0] || '*'
  }
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  // Accept either Firebase Auth or internal API secret (for server-to-server calls)
  const isInternal = verifyInternalSecret(req)
  if (!isInternal) {
    const auth = await verifyAuth(req)
    if (auth.error) return res.status(auth.status).json({ error: auth.error })
  }

  try {
    const emailUser = process.env.EMAIL_USER
    const emailPass = process.env.EMAIL_PASS
    const emailRecipient = process.env.LOG_EMAIL_RECIPIENT
    
    if (!emailUser || !emailPass || !emailRecipient) {
      return res.status(200).json({ 
        __skipped: 'missing_server_config', 
        message: 'EMAIL_USER, EMAIL_PASS, or LOG_EMAIL_RECIPIENT not configured' 
      })
    }

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
    const info = await transporter.sendMail({
      from: `"Venky's Logs" <${emailUser}>`,
      to: emailRecipient,
      subject: `[${type.toUpperCase()}] Log Alert - ${message.substring(0, 50)}`,
      html: emailBody,
    })

    return res.status(200).json({ ok: true, messageId: info.messageId })
  } catch (error) {
    console.error('Email send error:', error)
    return res.status(500).json({ error: 'Failed to send email' })
  }
}
