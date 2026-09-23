// Swaps invites.js's dependencies (auth, rate limiter, CORS, Firebase, mail,
// @vercel/functions) for stubs; the real invites.js handler runs unmodified.
const STUB = new URL('./invite-send-after-response.stubs.mjs', import.meta.url).href
const SWAP = ['/_lib/rateLimiter.js', '/_lib/verifyAuth.js', '/_lib/cors.js', '/_lib/fcm.js', '/_lib/mail/index.js']
export async function resolve(specifier, context, next) {
  if (specifier === '@vercel/functions' || SWAP.some((s) => specifier.endsWith(s.slice(1)) || specifier.endsWith(s))) {
    return { url: STUB, shortCircuit: true }
  }
  return next(specifier, context)
}
