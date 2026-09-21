// Swaps ONLY ../fcm.js (Firebase admin) for a stub so _lib/mail/index.js runs
// for real — real mailer package, real nodemailer — without touching Firestore.
const STUB = new URL('./mail-sender.fcm-stub.mjs', import.meta.url).href
export async function resolve(specifier, context, next) {
  if (specifier === '../fcm.js') return { url: STUB, shortCircuit: true }
  return next(specifier, context)
}
