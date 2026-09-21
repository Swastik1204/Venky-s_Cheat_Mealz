// Test doubles, driven through globalThis.__sle (set by the test).
const s = () => globalThis.__sle
export const createRateLimiter = () => async () => {}
export const handleCors = () => false
export const verifyInternalSecret = () => s().internal
export const verifyAuth = async () => s().auth
export const isStaffEmail = async (email) => { s().staffChecks.push(email); return s().staffEmails.includes(email) }
export default {
  createTransport: () => ({
    sendMail: async (msg) => { s().sent.push(msg); return { messageId: 'stub-1' } },
  }),
}
