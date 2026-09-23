const s = () => globalThis.__rl
export const FieldValue = { serverTimestamp: () => 'TS' }
export function adminDb() {
  s().adminDbCalls++
  return { collection: (name) => ({ add: async (doc) => { s().logWrites.push({ name, doc }) } }) }
}
export const isStaffEmail = async () => false
export const logRecipient = () => 'owner@example.com'
export async function sendMail(templateId, msg) { s().mails.push({ templateId, ...msg }); return { ok: true } }
// firebase-admin/app surface — any call here means an uncredentialed init.
export function initializeApp() { s().bareInitCalls++ }
export function getApps() { return [] }
export function cert() { return {} }
// @vercel/functions surface — records what the limiter hands to waitUntil.
export function waitUntil(p) { s().waited.push(p) }
