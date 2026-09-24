// Test doubles driven through globalThis.__inv (set by the test).
const s = () => globalThis.__inv
export const createRateLimiter = () => async () => {}
export const handleCors = () => false
export const verifyAuth = async () => ({ user: { name: 'Owner' }, roleEmail: 'owner@example.com' })
export const isAdminEmail = async () => true
export const isSuperAdminEmail = async () => true
export const adminAuth = () => ({})
export const FieldValue = { serverTimestamp: () => 'TS' }
function query() { return { where: () => query(), limit: () => query(), get: async () => ({ empty: true, docs: [] }) } }
export function adminDb() {
  return {
    collection: (name) => ({
      doc: (id) => ({ get: async () => ({ exists: false }), set: async (d) => { s().writes.push({ name, id, d }) } }),
      where: () => query(),
      add: async (d) => { s().writes.push({ name, d }) },
    }),
  }
}
// sendMail resolves only when the test releases it — simulating a slow SMTP send.
export function sendMail(templateId, msg) {
  s().sendStarted.push({ templateId, ...msg })
  return new Promise((resolve) => { s().releaseSend = (result) => resolve(result) })
}
export function waitUntil(p) { s().waitedOn.push(p) }
