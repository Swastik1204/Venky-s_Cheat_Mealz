// ESM resolve hook: swaps send-log-email.js's dependencies for stubs so the
// real handler runs in-process with no Firebase, Redis or SMTP.
const STUB = new URL('./send-log-email.stubs.mjs', import.meta.url).href
const SWAP = ['/_lib/rateLimiter.js', '/_lib/verifyAuth.js', '/_lib/cors.js', '/_lib/fcm.js']
export async function resolve(specifier, context, next) {
  if (specifier === 'nodemailer' || SWAP.some((s) => specifier.endsWith(s.slice(1)) || specifier.endsWith(s))) {
    return { url: STUB, shortCircuit: true }
  }
  return next(specifier, context)
}
