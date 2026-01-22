// Email notification API for log events
// POST body: { type: string, message: string, metadata: object }
// Uses Nodemailer with Gmail SMTP (free, unlimited)
// Requires env: EMAIL_USER (Gmail address), EMAIL_PASS (Gmail App Password)

import { createRateLimiter } from './lib/rateLimiter.js'
import nodemailer from 'nodemailer'

const rateLimiter = createRateLimiter({ routeName: 'send-log-email' })

export default async function handler(req, res) {
  // Apply rate limiting (20 emails per minute max to avoid spam)
  await rateLimiter(req, res, () => {})
  if (res.headersSent) return

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  try {
    const emailUser = process.env.EMAIL_USER
    const emailPass = process.env.EMAIL_PASS
    const emailRecipient = process.env.LOG_EMAIL_RECIPIENT || 'swastiksaha1204@gmail.com'
    
    if (!emailUser || !emailPass) {
      return res.status(200).json({ 
        __skipped: 'missing_server_config', 
        message: 'EMAIL_USER or EMAIL_PASS not configured' 
      })
    }

    const { type, message, metadata } = req.body || {}
    
    if (!type || !message) {
      return res.status(400).json({ error: 'missing_required_fields' })
    }

    // Format email body
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    const metadataStr = metadata ? JSON.stringify(metadata, null, 2) : ''
    
    const emailBody = `
<h2>🔔 New Log Entry</h2>
<p><strong>Type:</strong> ${type}</p>
<p><strong>Time:</strong> ${timestamp} IST</p>
<p><strong>Message:</strong></p>
<pre>${message}</pre>
${metadataStr ? `<p><strong>Details:</strong></p><pre>${metadataStr}</pre>` : ''}
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
    return res.status(500).json({ 
      __error: 'server_error', 
      message: String(error?.message || error) 
    })
  }
}
