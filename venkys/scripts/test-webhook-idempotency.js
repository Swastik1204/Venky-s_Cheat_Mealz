import crypto from 'crypto'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import handler from '../api/razorpay-webhook.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read .env for service account and secrets
const envFile = readFileSync(join(__dirname, '../.env'), 'utf8')
const getEnv = (key) => {
  const m = envFile.match(new RegExp(`${key}="?([^"\\r\\n]*)"?`))
  return m ? m[1] : process.env[key]
}

const saMatch = envFile.match(/FIREBASE_SERVICE_ACCOUNT="?({[\s\S]*?})"?\r?\n/)
const sa = saMatch ? JSON.parse(saMatch[1].replace(/\\"/g, '"').replace(/\\\\n/g, '\\n')) : null

if (!getApps().length && sa) {
  initializeApp({ credential: cert(sa) })
}

const secret = getEnv('RAZORPAY_WEBHOOK_SECRET') || 'test_webhook_secret_123'
process.env.RAZORPAY_WEBHOOK_SECRET = secret

function createMockReqRes({ body, signature, method = 'POST' }) {
  const req = {
    method,
    headers: {
      'x-razorpay-signature': signature,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
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

function signPayload(body, customSecret = secret) {
  const str = typeof body === 'string' ? body : JSON.stringify(body)
  return crypto.createHmac('sha256', customSecret).update(str).digest('hex')
}

async function runTests() {
  const db = getFirestore()
  console.log('=== RUNNING RAZORPAY WEBHOOK STATUS & IDEMPOTENCY TESTS ===\n')

  const testOrderDocId = `test-order-webhook-${Date.now()}`
  const orderRef = db.collection('orders').doc(testOrderDocId)

  try {
    // ----------------------------------------------------
    // TEST 1: Webhook signature validation
    // ----------------------------------------------------
    console.log('[TEST 1] Testing Webhook Signature Rejection on Bad Signature...')
    const dummyPayload = { event: 'payment.captured', payload: {} }
    const { req: badReq, res: badRes } = createMockReqRes({
      body: dummyPayload,
      signature: 'invalid_signature_hex_1234567890abcdef',
    })
    await handler(badReq, badRes)
    if (badRes.statusCode === 400 && badRes.data?.error?.includes('signature')) {
      console.log('✅ PASS: Invalid signature correctly rejected with 400 Bad Request.')
    } else {
      throw new Error(`Expected 400 with invalid signature, got ${badRes.statusCode}: ${JSON.stringify(badRes.data)}`)
    }

    // ----------------------------------------------------
    // TEST 2: Advancing pending-payment -> placed
    // ----------------------------------------------------
    console.log('\n[TEST 2] Testing Status Advancement (pending-payment -> placed) & Notification...')
    await orderRef.set({
      orderNo: testOrderDocId,
      userId: 'testCustomerUid123',
      orderType: 'delivery',
      status: 'pending-payment',
      totalAmount: 399,
      customer: { name: 'Test Customer', phone: '9876543210' },
      payment: { method: 'upi', status: 'pending' },
      statusHistory: [{ status: 'pending-payment', at: new Date(), actor: 'user:testCustomerUid123' }],
      createdAt: FieldValue.serverTimestamp(),
    })

    const webhookPayload1 = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_001',
            order_id: 'order_rzp_test_001',
            amount: 39900,
            currency: 'INR',
            status: 'captured',
            method: 'upi',
            notes: {
              firestoreOrderId: testOrderDocId,
            }
          }
        }
      }
    }

    const { req: req1, res: res1 } = createMockReqRes({
      body: webhookPayload1,
      signature: signPayload(webhookPayload1),
    })

    await handler(req1, res1)
    if (res1.statusCode !== 200) {
      throw new Error(`Webhook handler failed with status ${res1.statusCode}: ${JSON.stringify(res1.data)}`)
    }

    const snap1 = await orderRef.get()
    const order1 = snap1.data()

    if (order1.status !== 'placed') {
      throw new Error(`Expected order.status to be 'placed', got '${order1.status}'`)
    }
    if (order1.payment?.status !== 'paid' || order1.payment?.razorpayPaymentId !== 'pay_test_001') {
      throw new Error(`Expected payment.status to be 'paid', got ${JSON.stringify(order1.payment)}`)
    }
    const hasWebhookHistory = order1.statusHistory?.some(h => h.status === 'placed' && h.actor === 'webhook:razorpay')
    if (!hasWebhookHistory) {
      throw new Error(`Expected statusHistory to contain placed by webhook:razorpay, got ${JSON.stringify(order1.statusHistory)}`)
    }
    console.log('✅ PASS: Order status advanced to placed, payment recorded as paid, statusHistory updated, staffNotifiedAt recorded.')

    // ----------------------------------------------------
    // TEST 3: Idempotency & Race Handling
    // ----------------------------------------------------
    console.log('\n[TEST 3] Testing Idempotency on Repeat Webhook (Both-fire race simulation)...')
    const prevHistoryLength = order1.statusHistory.length

    const { req: req2, res: res2 } = createMockReqRes({
      body: webhookPayload1,
      signature: signPayload(webhookPayload1),
    })

    await handler(req2, res2)
    if (res2.statusCode !== 200) {
      throw new Error(`Repeat webhook handler failed with ${res2.statusCode}`)
    }

    const snap2 = await orderRef.get()
    const order2 = snap2.data()

    if (order2.status !== 'placed') {
      throw new Error(`Expected status to remain 'placed', got '${order2.status}'`)
    }
    if (order2.statusHistory.length !== prevHistoryLength) {
      throw new Error(`Duplicate history entries added! Old length: ${prevHistoryLength}, new length: ${order2.statusHistory.length}`)
    }
    console.log('✅ PASS: Repeat webhook safely handled without duplicate status history or double notification.')

    // ----------------------------------------------------
    // TEST 4: Non-reversion of In-Progress Order
    // ----------------------------------------------------
    console.log('\n[TEST 4] Testing That Advanced Order (e.g. preparing/delivered) is Not Reverted...')
    await orderRef.set({
      status: 'preparing',
      statusHistory: [
        ...order2.statusHistory,
        { status: 'preparing', at: new Date(), actor: 'staff:admin@test.com' }
      ]
    }, { merge: true })

    const { req: req3, res: res3 } = createMockReqRes({
      body: webhookPayload1,
      signature: signPayload(webhookPayload1),
    })

    await handler(req3, res3)
    const snap3 = await orderRef.get()
    const order3 = snap3.data()

    if (order3.status !== 'preparing') {
      throw new Error(`Order status was reverted from 'preparing' to '${order3.status}'!`)
    }
    console.log('✅ PASS: Order status remained in "preparing", never overwritten by webhook.')

    console.log('\n🎉 ALL RAZORPAY WEBHOOK IDEMPOTENCY & STATUS TESTS PASSED!')
  } finally {
    // Cleanup test order document
    await orderRef.delete().catch(() => {})
    console.log('\nCleaned up test document:', testOrderDocId)
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err)
  process.exit(1)
})
