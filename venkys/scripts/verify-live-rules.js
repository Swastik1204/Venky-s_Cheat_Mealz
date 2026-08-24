import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import https from 'https'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read service account from .env
const envFile = readFileSync(join(__dirname, '../.env'), 'utf8')
const saMatch = envFile.match(/FIREBASE_SERVICE_ACCOUNT="?({[\s\S]*?})"?\r?\n/)
if (!saMatch) {
  console.error('Could not find FIREBASE_SERVICE_ACCOUNT in .env')
  process.exit(1)
}

const sa = JSON.parse(saMatch[1].replace(/\\"/g, '"').replace(/\\\\n/g, '\\n'))

function createJwt(sa) {
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const claimSet = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }
  
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const payload = `${b64(header)}.${b64(claimSet)}`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(payload)
  const sig = sign.sign(sa.private_key, 'base64url')
  return `${payload}.${sig}`
}

async function getAccessToken(jwt) {
  return new Promise((resolve, reject) => {
    const postData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve(json.access_token)
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

async function fetchLiveRelease(token, projectId) {
  return new Promise((resolve, reject) => {
    const req = https.request(`https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function fetchRuleset(token, rulesetName) {
  return new Promise((resolve, reject) => {
    const req = https.request(`https://firebaserules.googleapis.com/v1/${rulesetName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function main() {
  console.log('Authenticating with Google OAuth API...')
  const jwt = createJwt(sa)
  const token = await getAccessToken(jwt)
  if (!token) throw new Error('Failed to obtain Google access token')

  console.log('Fetching active release metadata for cloud.firestore...')
  const release = await fetchLiveRelease(token, sa.project_id)
  console.log('Active Release:', release.name)
  console.log('Active Ruleset ID:', release.rulesetName)
  console.log('Last Updated (UTC):', release.updateTime)

  console.log('\nFetching live ruleset content...')
  const ruleset = await fetchRuleset(token, release.rulesetName)
  const source = ruleset.source?.files?.[0]?.content || ''
  
  console.log('Live Ruleset File Name:', ruleset.source?.files?.[0]?.name)
  console.log('Live Ruleset Size (bytes):', Buffer.byteLength(source, 'utf8'))
  
  // Verify top-level orders list rule in live source
  const topOrdersMatch = source.match(/\/\/ ORDERS COLLECTION \(Main Orders\)[\s\S]*?match \/orders\/\{orderId\}[\s\S]*?allow list:[\s\S]*?;/)
  if (topOrdersMatch) {
    console.log('\n--- LIVE DEPLOYED TOP-LEVEL RULE ON /orders/{orderId} ---')
    console.log(topOrdersMatch[0])
  }

  const isVulnerable = source.includes('allow list: if isAdmin() || canViewOrders() || isDeliveryUser() || isSignedIn();')
  const isSecured = source.includes('resource.data.userId == request.auth.uid')

  console.log('\n--- SECURITY VERIFICATION ---')
  console.log('Contains old vulnerable list rule:', isVulnerable ? '❌ YES' : '✅ NO')
  console.log('Contains new owner-restricted list rule:', isSecured ? '✅ YES' : '❌ NO')
}

main().catch(err => {
  console.error('Error verifying live rules:', err)
  process.exit(1)
})
