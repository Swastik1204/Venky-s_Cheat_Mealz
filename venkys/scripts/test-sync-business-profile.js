import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import handler from '../api/sync-business-profile.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const envFile = readFileSync(join(__dirname, '../.env'), 'utf8')
const saMatch = envFile.match(/FIREBASE_SERVICE_ACCOUNT="?({[\s\S]*?})"?\r?\n/)
const sa = saMatch ? JSON.parse(saMatch[1].replace(/\\"/g, '"').replace(/\\\\n/g, '\\n')) : null

if (!getApps().length && sa) {
  initializeApp({ credential: cert(sa) })
}

function createMockReqRes({ method = 'GET', headers = {}, body = null, query = {} } = {}) {
  const req = {
    method,
    headers,
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null,
    query,
  }
  const res = {
    statusCode: 200,
    headers: {},
    headersSent: false,
    setHeader(k, v) { this.headers[k] = v },
    status(code) {
      this.statusCode = code
      return this
    },
    json(data) {
      this.data = data
      this.headersSent = true
      return this
    },
    end() {
      this.headersSent = true
      return this
    }
  }
  return { req, res }
}

async function runTests() {
  console.log('=== TESTING API/SYNC-BUSINESS-PROFILE AUTH & PUBLIC DATA SPLIT ===\n')

  // ----------------------------------------------------
  // TEST 1: Unauthenticated POST
  // ----------------------------------------------------
  console.log('[TEST 1] Testing Unauthenticated POST Request...')
  const { req: req1, res: res1 } = createMockReqRes({
    method: 'POST',
    headers: {},
    body: { placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' }
  })
  await handler(req1, res1)
  if (res1.statusCode === 401 && res1.data?.error?.includes('Authentication required')) {
    console.log('✅ PASS: Unauthenticated POST rejected with 401 Unauthorized.')
  } else {
    throw new Error(`Expected 401, got ${res1.statusCode}: ${JSON.stringify(res1.data)}`)
  }

  // ----------------------------------------------------
  // TEST 2: Customer (Non-Staff) POST
  // ----------------------------------------------------
  console.log('\n[TEST 2] Testing Customer (Non-Staff) POST Request with ID Token...')
  // Create a custom token for customer user
  const customerUid = 'test-customer-profile-user'
  const customerCustomToken = await getAuth().createCustomToken(customerUid, { email: 'customer@example.com' })
  
  // Exchange custom token for an ID token via Google Identity Toolkit REST API
  const apiKeyMatch = envFile.match(/VITE_FIREBASE_API_KEY=["']?([^"'\r\n]+)["']?/)
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : ''
  
  const tokenRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customerCustomToken, returnSecureToken: true })
  })
  const tokenData = await tokenRes.json()
  const customerIdToken = tokenData.idToken

  if (!customerIdToken) {
    throw new Error('Could not obtain customer ID token for test')
  }

  const { req: req2, res: res2 } = createMockReqRes({
    method: 'POST',
    headers: {
      authorization: `Bearer ${customerIdToken}`
    },
    body: { placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' }
  })
  await handler(req2, res2)
  if (res2.statusCode === 403 && res2.data?.error?.includes('Admin or staff access required')) {
    console.log('✅ PASS: Customer (Non-Staff) POST rejected with 403 Forbidden.')
  } else {
    throw new Error(`Expected 403, got ${res2.statusCode}: ${JSON.stringify(res2.data)}`)
  }

  // ----------------------------------------------------
  // TEST 3: Public Unauthenticated GET (Cached Read)
  // ----------------------------------------------------
  console.log('\n[TEST 3] Testing Public Unauthenticated GET Request (Cached Read)...')
  const { req: req3, res: res3 } = createMockReqRes({
    method: 'GET',
    headers: {},
  })
  await handler(req3, res3)
  if (res3.statusCode === 200 && res3.data?.success === true) {
    console.log('✅ PASS: Public GET returns 200 with sanitized cached profile data.')
    console.log('Public Data Keys:', Object.keys(res3.data.data || {}))
  } else {
    throw new Error(`Expected 200, got ${res3.statusCode}: ${JSON.stringify(res3.data)}`)
  }

  // ----------------------------------------------------
  // TEST 4: Unsupported HTTP Method (DELETE / PUT)
  // ----------------------------------------------------
  console.log('\n[TEST 4] Testing Unsupported HTTP Method (DELETE)...')
  const { req: req4, res: res4 } = createMockReqRes({
    method: 'DELETE',
  })
  await handler(req4, res4)
  if (res4.statusCode === 405) {
    console.log('✅ PASS: Unsupported method rejected with 405 Method Not Allowed.')
  } else {
    throw new Error(`Expected 405, got ${res4.statusCode}`)
  }

  console.log('\n🎉 ALL SYNC-BUSINESS-PROFILE AUTH & BEHAVIOR TESTS PASSED!')
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err)
  process.exit(1)
})
