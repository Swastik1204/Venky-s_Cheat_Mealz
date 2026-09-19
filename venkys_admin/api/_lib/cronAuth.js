/* eslint-env node */
// Shared cron-endpoint authentication. Keep byte-identical with
// venkys_admin/api/_lib/cronAuth.js (a test enforces it).
//
// A cron endpoint is trusted ONLY when the request carries
//   Authorization: Bearer <CRON_SECRET>
// This is what Vercel Cron sends automatically when CRON_SECRET is set on the
// project, and what an external scheduler (cron-job.org etc.) must send.
//
// Deliberately NOT trusted: the `x-vercel-cron` header. Any client can set it,
// so it proves nothing (it was the gate on cleanup-logs.js until this change).
//
// Fails closed: with CRON_SECRET unset or empty nothing authenticates, so a
// missing env var can never open the endpoint.

import crypto from 'crypto'

export function isValidCronAuth(req, secret = process.env.CRON_SECRET) {
  const expected = String(secret || '')
  if (!expected) return false
  const provided = String(req?.headers?.authorization || '')
  const a = Buffer.from(provided)
  const b = Buffer.from(`Bearer ${expected}`)
  // timingSafeEqual throws on unequal lengths, so compare lengths first.
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
