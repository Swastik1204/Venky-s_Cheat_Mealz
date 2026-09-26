// The REAL place-order handlers (venkys AND venkys_admin) end to end on the Firestore + Auth emulators, with a real ID token:
// the order total, taxAmount and stored taxRateBp under each settings shape (npm run test:emulator).
import { test, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Refusing to run without the emulators (npm run test:emulator)')
process.env.GCLOUD_PROJECT = 'demo-venkys-gst'
process.env.RATE_LIMIT_DISABLED = '1' // the per-uid limiter (3 orders / 15 min) is not what is under test
delete process.env.FIREBASE_SERVICE_ACCOUNT
const require = createRequire(import.meta.url)
const { initializeApp, getApps } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')
if (!getApps().length) initializeApp({ projectId: 'demo-venkys-gst' })
const db = getFirestore()
const auth = getAuth()

const { default: customerHandler } = await import('../api/place-order.js')
const { default: adminHandler } = await import('../../venkys_admin/api/place-order.js')

let idToken
before(async () => {
  const user = await auth.getUserByEmail('diner@example.com').catch(() => auth.createUser({ email: 'diner@example.com', emailVerified: true }))
  const custom = await auth.createCustomToken(user.uid)
  const r = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: custom, returnSecureToken: true }),
  })
  idToken = (await r.json()).idToken
  assert.ok(idToken, 'auth emulator issued an ID token')
})
beforeEach(async () => {
  for (const c of ['orders', 'menu', 'miscellaneous']) await db.recursiveDelete(db.collection(c))
  await db.doc('menu/Mains').set({ items: [{ name: 'Butter Chicken', rate: 200 }, { name: 'Naan', rate: 30 }] })
})

const call = async (handler, body) => {
  const res = { statusCode: 200, body: null, headers: {}, setHeader(k, v) { this.headers[k] = v }, status(c) { this.statusCode = c; return this }, json(b) { this.body = b; return this }, end() { return this } }
  await handler({ method: 'POST', headers: { authorization: `Bearer ${idToken}`, 'x-forwarded-for': '203.0.113.9' }, body, socket: { remoteAddress: '203.0.113.9' } }, res)
  return res
}
const cart = (extra = {}) => ({ items: [{ name: 'Butter Chicken', qty: 2 }, { name: 'Naan', qty: 3 }], customer: { name: 'A B', phone: '9876543210', address: 'x' }, orderType: 'delivery', paymentMethod: 'cod', ...extra })  // subtotal 490
const setSettings = (d) => db.doc('miscellaneous/settings').set(d)
const orderOf = async (res) => (await db.doc(`orders/${res.body.orderNo}`).get()).data()

for (const [name, handler] of [['venkys', customerHandler], ['venkys_admin', adminHandler]]) {
  test(`${name}: the LIVE settings shape (gstRate 0.05, no gstEnabled) places an order with NO tax: behaviour unchanged`, async () => {
    await setSettings({ gstRate: 0.05 })
    const r = await call(handler, cart())
    assert.equal(r.statusCode, 200, JSON.stringify(r.body))
    const o = await orderOf(r)
    assert.deepEqual([o.subtotal, o.totalAmount, 'taxAmount' in o, 'taxRateBp' in o, 'taxRate' in o], [490, 490, false, false, false])
  })

  test(`${name}: gstEnabled + gstRateBp 500 adds exactly 5% (490 -> tax 25 [24.5 half-up], total 515) and stores the integer rate; a client taxRate is ignored`, async () => {
    await setSettings({ gstEnabled: true, gstRateBp: 500 })
    const r = await call(handler, cart({ taxRate: 0.9 }))
    assert.equal(r.statusCode, 200, JSON.stringify(r.body))
    const o = await orderOf(r)
    assert.deepEqual([o.subtotal, o.taxAmount, o.totalAmount, o.taxRateBp, 'taxRate' in o], [490, 25, 515, 500, false])
  })

  test(`${name}: a RESTORED old snapshot (legacy gstRate only, even with gstEnabled) cannot mis-tax: no tax`, async () => {
    await setSettings({ gstEnabled: true, gstRate: 0.05 })
    const r = await call(handler, cart())
    assert.equal(r.statusCode, 200, JSON.stringify(r.body))
    const o = await orderOf(r)
    assert.deepEqual([o.totalAmount, 'taxAmount' in o], [490, false])
  })

  test(`${name}: an invalid stored rate (float, 0, above 28%) means no tax, and the order still succeeds`, async () => {
    for (const bad of [5.5, 0, 2801, '500']) {
      await setSettings({ gstEnabled: true, gstRateBp: bad })
      const r = await call(handler, cart())
      assert.equal(r.statusCode, 200, `${String(bad)}: ${JSON.stringify(r.body)}`)
      assert.equal((await orderOf(r)).totalAmount, 490, String(bad))
    }
  })
}
