// Real end-to-end test of the staff invite flow against the LIVE Firebase
// project (not an emulator) — proves create-invite -> email -> verify-invite
// -> redeem-invite -> roles/{email} actually works, plus expiry and revoke
// rejections. Sends a real email and creates/deletes disposable Firebase
// Auth users + Firestore docs (Gmail "+alias" test addresses, all routed to
// and cleaned up under the super admin's own inbox).
// Run: node scripts/test-invite-flow.mjs (from venkys_admin/, needs .env)
import { readFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const envPath = new URL('../.env', import.meta.url)
const envText = readFileSync(envPath, 'utf8')
const env = {}
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '')
}
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v

const app = initializeApp({ credential: cert(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT)) })
const auth = getAuth(app)
const db = getFirestore(app)

const API_KEY = env.VITE_FIREBASE_API_KEY
const SUPER_ADMIN_EMAIL = 'swastiksaha1204@gmail.com'
const stamp = Date.now()
const TEST_EMAIL = `swastiksaha1204+invitetest${stamp}@gmail.com`

async function idTokenForUid(uid) {
  const customToken = await auth.createCustomToken(uid)
  const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  })
  const data = await resp.json()
  if (!data.idToken) throw new Error('Failed to exchange custom token: ' + JSON.stringify(data))
  return data.idToken
}

function mockRes() {
  const res = {
    _status: 200,
    _body: null,
    headersSent: false,
    setHeader() {},
    status(code) { this._status = code; return this },
    json(body) { this._body = body; this.headersSent = true; return this },
    end() { this.headersSent = true; return this },
  }
  return res
}

async function call(handlerModulePath, { token, body }) {
  const mod = await import(handlerModulePath)
  const req = {
    method: 'POST',
    headers: { authorization: token ? `Bearer ${token}` : '', origin: 'https://venkys-admin.web.app' },
    query: {},
    url: '/api/test',
    connection: {},
    body,
  }
  const res = mockRes()
  await mod.default(req, res)
  return { status: res._status, body: res._body }
}

const results = []
function report(name, pass, detail) {
  results.push({ name, pass, detail })
  console.log(`${pass ? '✅ PASS' : '❌ FAIL'}: ${name}${detail ? ' — ' + detail : ''}`)
}

async function main() {
  console.log('--- Setup: resolving super admin UID + minting ID tokens ---')
  const superAdminUser = await auth.getUserByEmail(SUPER_ADMIN_EMAIL)
  const adminIdToken = await idTokenForUid(superAdminUser.uid)
  console.log('Admin ID token acquired for', SUPER_ADMIN_EMAIL)

  // ============================================================
  // TEST 1: full happy path — create, verify, redeem
  // ============================================================
  console.log(`\n=== TEST 1: happy path (${TEST_EMAIL}) ===`)

  const createRes = await call('../api/create-invite.js', {
    token: adminIdToken,
    body: { email: TEST_EMAIL, role: 'staff', pages: { orders: true, settings: true }, defaultPage: 'orders' },
  })
  report('create-invite succeeds (200)', createRes.status === 200, JSON.stringify(createRes.body))
  const inviteToken = createRes.body?.token
  if (!inviteToken) throw new Error('No invite token returned, cannot continue')
  console.log('Real invite email sent to', TEST_EMAIL, '(check inbox — Gmail + alias routes to swastiksaha1204@gmail.com)')

  const verifyRes = await call('../api/verify-invite.js', { body: { token: inviteToken } })
  report('verify-invite reports valid:true before claim', verifyRes.body?.valid === true, JSON.stringify(verifyRes.body))
  report('verify-invite returns the captured role', verifyRes.body?.role === 'staff', JSON.stringify(verifyRes.body))

  // Simulate the invitee: create their Firebase Auth account + ID token.
  const invitee = await auth.createUser({ email: TEST_EMAIL, emailVerified: true })
  const inviteeIdToken = await idTokenForUid(invitee.uid)

  const redeemRes = await call('../api/redeem-invite.js', { token: inviteeIdToken, body: { token: inviteToken } })
  report('redeem-invite succeeds (200)', redeemRes.status === 200, JSON.stringify(redeemRes.body))

  const roleSnap = await db.collection('roles').doc(TEST_EMAIL).get()
  const roleData = roleSnap.data()
  console.log('Resulting roles/{email} doc:', JSON.stringify(roleData, (k, v) => (v?._seconds ? '<timestamp>' : v)))
  report('roles/{email} doc was created', roleSnap.exists)
  report('role matches captured config (staff)', roleData?.role === 'staff')
  report('pages matches captured config', JSON.stringify(roleData?.pages) === JSON.stringify({ orders: true, settings: true }), JSON.stringify(roleData?.pages))
  report('defaultPage matches captured config', roleData?.defaultPage === 'orders', roleData?.defaultPage)

  const inviteAfterClaim = await db.collection('staffInvites').doc(inviteToken).get()
  report('invite marked claimed', inviteAfterClaim.data()?.status === 'claimed', inviteAfterClaim.data()?.status)

  const verifyAfterClaim = await call('../api/verify-invite.js', { body: { token: inviteToken } })
  report('verify-invite now reports claimed (cannot reuse)', verifyAfterClaim.body?.reason === 'claimed', JSON.stringify(verifyAfterClaim.body))

  const redeemAgain = await call('../api/redeem-invite.js', { token: inviteeIdToken, body: { token: inviteToken } })
  report('re-redeeming an already-claimed invite is rejected', redeemAgain.status !== 200, JSON.stringify(redeemAgain.body))

  const dupInvite = await call('../api/create-invite.js', {
    token: adminIdToken,
    body: { email: TEST_EMAIL, role: 'staff', pages: { orders: true }, defaultPage: null },
  })
  report('inviting an email that already has a roles doc is blocked (409)', dupInvite.status === 409, JSON.stringify(dupInvite.body))

  // ============================================================
  // TEST 2: expiry actually blocks a stale token
  // ============================================================
  console.log('\n=== TEST 2: expired invite is blocked ===')
  const EXPIRED_EMAIL = `swastiksaha1204+invitetest${stamp}-expired@gmail.com`
  const expiredCreate = await call('../api/create-invite.js', {
    token: adminIdToken,
    body: { email: EXPIRED_EMAIL, role: 'staff', pages: { orders: true }, defaultPage: null },
  })
  const expiredToken = expiredCreate.body?.token
  report('create-invite for expiry test succeeds', expiredCreate.status === 200)

  // Force the expiry into the past directly in Firestore (simulating 48h+ elapsed).
  await db.collection('staffInvites').doc(expiredToken).update({
    expiresAt: Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000)),
  })

  const verifyExpired = await call('../api/verify-invite.js', { body: { token: expiredToken } })
  report('verify-invite reports expired', verifyExpired.body?.reason === 'expired', JSON.stringify(verifyExpired.body))

  const expiredInvitee = await auth.createUser({ email: EXPIRED_EMAIL, emailVerified: true })
  const expiredIdToken = await idTokenForUid(expiredInvitee.uid)
  const redeemExpired = await call('../api/redeem-invite.js', { token: expiredIdToken, body: { token: expiredToken } })
  report('redeem-invite rejects an expired token', redeemExpired.status === 400, JSON.stringify(redeemExpired.body))
  const roleAfterExpired = await db.collection('roles').doc(EXPIRED_EMAIL).get()
  report('no roles/{email} doc was created for the expired attempt', !roleAfterExpired.exists)

  // ============================================================
  // TEST 3: revoke actually blocks a pending invite
  // ============================================================
  console.log('\n=== TEST 3: revoked invite is blocked ===')
  const REVOKED_EMAIL = `swastiksaha1204+invitetest${stamp}-revoked@gmail.com`
  const revokeCreate = await call('../api/create-invite.js', {
    token: adminIdToken,
    body: { email: REVOKED_EMAIL, role: 'staff', pages: { orders: true }, defaultPage: null },
  })
  const revokeToken = revokeCreate.body?.token
  report('create-invite for revoke test succeeds', revokeCreate.status === 200)

  const revokeCall = await call('../api/revoke-invite.js', { token: adminIdToken, body: { token: revokeToken } })
  report('revoke-invite succeeds as admin', revokeCall.status === 200, JSON.stringify(revokeCall.body))

  const verifyRevoked = await call('../api/verify-invite.js', { body: { token: revokeToken } })
  report('verify-invite reports revoked', verifyRevoked.body?.reason === 'revoked', JSON.stringify(verifyRevoked.body))

  const revokedInvitee = await auth.createUser({ email: REVOKED_EMAIL, emailVerified: true })
  const revokedIdToken = await idTokenForUid(revokedInvitee.uid)
  const redeemRevoked = await call('../api/redeem-invite.js', { token: revokedIdToken, body: { token: revokeToken } })
  report('redeem-invite rejects a revoked token', redeemRevoked.status === 400, JSON.stringify(redeemRevoked.body))

  // Non-admin cannot revoke
  const nonAdminRevokeAttempt = await call('../api/revoke-invite.js', { token: inviteeIdToken, body: { token: revokeToken } })
  report('non-admin cannot call revoke-invite (403)', nonAdminRevokeAttempt.status === 403, JSON.stringify(nonAdminRevokeAttempt.body))

  // Email mismatch check
  console.log('\n=== TEST 4: email-mismatch rejection ===')
  const MISMATCH_EMAIL = `swastiksaha1204+invitetest${stamp}-mismatch@gmail.com`
  const mismatchCreate = await call('../api/create-invite.js', {
    token: adminIdToken,
    body: { email: MISMATCH_EMAIL, role: 'staff', pages: { orders: true }, defaultPage: null },
  })
  const mismatchToken = mismatchCreate.body?.token
  // Try to redeem it while signed in as the ORIGINAL test invitee (wrong email)
  const mismatchRedeem = await call('../api/redeem-invite.js', { token: inviteeIdToken, body: { token: mismatchToken } })
  report('redeem-invite rejects a signed-in-as-wrong-email attempt (403)', mismatchRedeem.status === 403, JSON.stringify(mismatchRedeem.body))

  // ============================================================
  // Cleanup
  // ============================================================
  console.log('\n--- Cleanup: removing every test doc/user created ---')
  await db.collection('roles').doc(TEST_EMAIL).delete().catch(() => {})
  for (const t of [inviteToken, expiredToken, revokeToken, mismatchToken]) {
    if (t) await db.collection('staffInvites').doc(t).delete().catch(() => {})
  }
  for (const email of [TEST_EMAIL, EXPIRED_EMAIL, REVOKED_EMAIL, MISMATCH_EMAIL]) {
    try {
      const u = await auth.getUserByEmail(email)
      await auth.deleteUser(u.uid)
    } catch { /* not created or already gone */ }
  }
  // Also purge any log entries this run wrote.
  const logsSnap = await db.collection('logs').where('documentId', 'in', [TEST_EMAIL, EXPIRED_EMAIL, REVOKED_EMAIL, MISMATCH_EMAIL]).get().catch(() => null)
  if (logsSnap) for (const d of logsSnap.docs) await d.ref.delete().catch(() => {})
  console.log('Cleanup complete.')

  const failed = results.filter((r) => !r.pass)
  console.log(`\n${failed.length === 0 ? '🎉 ALL' : '⚠️ ' + failed.length + ' OF ' + results.length} ${results.length} CHECKS PASSED`)
  if (failed.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error('E2E test crashed:', err)
  process.exit(1)
})
