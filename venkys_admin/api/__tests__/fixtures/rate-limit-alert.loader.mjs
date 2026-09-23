// Swaps ONLY the Firebase (fcm.js) and mail modules the rate limiter imports,
// so meta.js + the real rateLimiter.js run in a fresh process like a Vercel
// function would. firebase-admin/app is also swapped, to detect any bare
// initializeApp() call (the bug this test guards).
const STUB = new URL('./rate-limit-alert.stubs.mjs', import.meta.url).href
export async function resolve(specifier, context, next) {
  if (specifier === './fcm.js' || specifier.endsWith('/_lib/fcm.js') ||
      specifier === './mail/index.js' || specifier === 'firebase-admin/app' ||
      specifier === '@vercel/functions') {
    return { url: STUB, shortCircuit: true }
  }
  return next(specifier, context)
}
