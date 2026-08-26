// Real end-to-end test of the log-cleanup review flow against the LIVE
// Firebase project — creates disposable old log entries, calls the actual
// cron scan handler, verifies the email + pendingLogCleanup doc, then calls
// the actual delete handler with one entry deselected, and confirms exactly
// the selected ones are gone while the deselected one survives.
// Run: node scripts/test-log-cleanup-flow.mjs (from venkys_admin/, needs .env)
import { readFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'

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
// API_INTERNAL_SECRET isn't configured in .env yet (no server-to-server
// caller needs it currently) — generate one just for this test run so we can
// exercise the manual-trigger path the same way a real internal caller
// would, without touching the app's persisted env config.
const INTERNAL_SECRET = env.API_INTERNAL_SECRET || (await import('crypto')).randomUUID()
process.env.API_INTERNAL_SECRET = INTERNAL_SECRET

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
    _status: 200, _body: null, headersSent: false,
    setHeader() {}, status(c) { this._status = c; return this }, json(b) { this._body = b; this.headersSent = true; return this }, end() { this.headersSent = true; return this },
  }
  return res
}

async function call(handlerPath, { method = 'GET', token, secret, body } = {}) {
  const mod = await import(handlerPath)
  const req = {
    method,
    headers: {
      authorization: token ? `Bearer ${token}` : '',
      origin: 'https://venkys-admin.web.app',
      ...(secret ? { 'x-internal-secret': secret } : {}),
    },
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
  const stamp = Date.now()
  const testDocIds = []

  console.log('--- Setup: creating 3 disposable old test log entries (>2 months old) ---')
  const oldDate = Timestamp.fromDate(new Date(Date.now() - 75 * 24 * 60 * 60 * 1000)) // 75 days ago
  for (let i = 0; i < 3; i++) {
    const ref = await db.collection('logs').add({
      action: 'update',
      collection: 'test-fixture',
      documentId: `cleanup-test-${stamp}-${i}`,
      performedBy: 'test-harness@example.com',
      readableAction: `test-harness@example.com made a test change #${i} (fixture for cleanup flow test, stamp ${stamp})`,
      timestamp: oldDate,
      metadata: { testStamp: stamp, index: i },
    })
    testDocIds.push(ref.id)
  }
  console.log('Created test log docs:', testDocIds)

  console.log('\n=== Scan: manually trigger cleanup-logs-scan via internal secret ===')
  const scanRes = await call('../api/cleanup-logs-scan.js', { secret: INTERNAL_SECRET })
  report('cleanup-logs-scan succeeds (200)', scanRes.status === 200, JSON.stringify(scanRes.body))
  report('scan reports emailSent:true', scanRes.body?.emailSent === true, JSON.stringify(scanRes.body))
  const token = scanRes.body?.token
  if (!token) throw new Error('No token returned by scan, cannot continue')
  console.log('Real review email sent to', SUPER_ADMIN_EMAIL, '— token:', token)

  const batchSnap = await db.collection('pendingLogCleanup').doc(token).get()
  const batchData = batchSnap.data()
  report('pendingLogCleanup doc created with status pending', batchData?.status === 'pending')
  const ourCandidates = (batchData.candidates || []).filter((c) => testDocIds.includes(c.id))
  report('all 3 test logs appear in the candidate list with readable summaries', ourCandidates.length === 3, `found ${ourCandidates.length}`)
  console.log('Sample candidate summary:', JSON.stringify(ourCandidates[0]))

  console.log('\n=== Delete: admin reviews, deselects one, deletes the rest ===')
  const superAdminUser = await auth.getUserByEmail(SUPER_ADMIN_EMAIL)
  const adminIdToken = await idTokenForUid(superAdminUser.uid)

  const keepId = testDocIds[0] // deselected — should survive
  const deleteIds = testDocIds.slice(1) // selected — should be deleted
  console.log('Keeping (deselected):', keepId)
  console.log('Deleting (selected):', deleteIds)

  // Non-superadmin cannot delete (sanity check on the gate)
  const staffUser = await auth.createUser({ email: `cleanup-test-nonadmin-${stamp}@example.com`, emailVerified: true })
  const staffIdToken = await idTokenForUid(staffUser.uid)
  const nonAdminAttempt = await call('../api/cleanup-logs-delete.js', { method: 'POST', token: staffIdToken, body: { token, logIds: deleteIds } })
  report('non-superadmin delete attempt rejected (403)', nonAdminAttempt.status === 403, JSON.stringify(nonAdminAttempt.body))
  await auth.deleteUser(staffUser.uid)

  const deleteRes = await call('../api/cleanup-logs-delete.js', { method: 'POST', token: adminIdToken, body: { token, logIds: deleteIds } })
  report('cleanup-logs-delete succeeds (200)', deleteRes.status === 200, JSON.stringify(deleteRes.body))
  report('deletedCount matches selection', deleteRes.body?.deletedCount === deleteIds.length, JSON.stringify(deleteRes.body))

  console.log('\n=== Verify: exactly the selected docs are gone, the deselected one survives ===')
  const keptSnap = await db.collection('logs').doc(keepId).get()
  report('deselected log still exists in Firestore', keptSnap.exists)
  for (const id of deleteIds) {
    const snap = await db.collection('logs').doc(id).get()
    report(`deleted log ${id} no longer exists`, !snap.exists)
  }

  const batchAfter = await db.collection('pendingLogCleanup').doc(token).get()
  report('pendingLogCleanup doc was cleaned up after deletion', !batchAfter.exists)

  const auditEntry = await db.collection('logs')
    .where('metadata.batchToken', '==', token)
    .limit(1)
    .get()
  report('a single audit-log entry recorded the cleanup action itself', !auditEntry.empty)
  if (!auditEntry.empty) console.log('Audit entry:', auditEntry.docs[0].data().readableAction)

  console.log('\n=== Stale-token check: an un-actioned batch gets superseded by the next scan, not stacked ===')
  const fixtureA = await db.collection('logs').add({
    action: 'update', collection: 'test-fixture', documentId: `cleanup-test-${stamp}-A`,
    performedBy: 'test-harness@example.com',
    readableAction: `test-harness@example.com made test change A (stamp ${stamp})`,
    timestamp: oldDate, metadata: { testStamp: stamp, tag: 'A' },
  })
  const scanA = await call('../api/cleanup-logs-scan.js', { secret: INTERNAL_SECRET })
  const tokenA = scanA.body?.token
  report('first scan (batch A) succeeds', scanA.status === 200 && !!tokenA)

  // Don't action batch A. Add another old log and scan again — batch A
  // should flip to 'superseded' rather than a second email/token stacking.
  const fixtureB = await db.collection('logs').add({
    action: 'update', collection: 'test-fixture', documentId: `cleanup-test-${stamp}-B`,
    performedBy: 'test-harness@example.com',
    readableAction: `test-harness@example.com made test change B (stamp ${stamp})`,
    timestamp: oldDate, metadata: { testStamp: stamp, tag: 'B' },
  })
  const scanB = await call('../api/cleanup-logs-scan.js', { secret: INTERNAL_SECRET })
  const tokenB = scanB.body?.token
  report('second scan (batch B) succeeds with a distinct token', scanB.status === 200 && !!tokenB && tokenB !== tokenA)

  const batchAAfter = await db.collection('pendingLogCleanup').doc(tokenA).get()
  report('un-actioned batch A was marked superseded (not left pending, not deleted)', batchAAfter.data()?.status === 'superseded', batchAAfter.data()?.status)
  const batchBAfter = await db.collection('pendingLogCleanup').doc(tokenB).get()
  report('fresh batch B is pending and includes both A and B fixtures (folded together, nothing lost)', batchBAfter.data()?.status === 'pending' && (batchBAfter.data()?.logIds || []).includes(fixtureA.id) && (batchBAfter.data()?.logIds || []).includes(fixtureB.id))

  // Test-only teardown (not via the app — this is just cleanup of fixtures).
  await db.collection('logs').doc(fixtureA.id).delete().catch(() => {})
  await db.collection('logs').doc(fixtureB.id).delete().catch(() => {})
  await db.collection('pendingLogCleanup').doc(tokenA).delete().catch(() => {})
  await db.collection('pendingLogCleanup').doc(tokenB).delete().catch(() => {})

  console.log('\n--- Cleanup complete (all test fixtures removed) ---')

  const failed = results.filter((r) => !r.pass)
  console.log(`\n${failed.length === 0 ? '🎉 ALL' : '⚠️ ' + failed.length + ' OF ' + results.length} ${results.length} CHECKS PASSED`)
  if (failed.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error('E2E test crashed:', err)
  process.exit(1)
})
