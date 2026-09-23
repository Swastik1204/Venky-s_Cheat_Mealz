// Test doubles, driven through globalThis.__sle (set by the test).
const s = () => globalThis.__sle
export const createRateLimiter = () => async () => {}
export const handleCors = () => false
export const verifyInternalSecret = () => s().internal
export const verifyAuth = async () => s().auth
export const isStaffEmail = async (email) => { s().staffChecks.push(email); return s().staffEmails.includes(email) }
export const logRecipient = () => 'owner@example.com'
export const sendMail = async (templateId, msg) => { s().sent.push({ templateId, ...msg }); return { ok: true, messageId: 'stub-1' } }
