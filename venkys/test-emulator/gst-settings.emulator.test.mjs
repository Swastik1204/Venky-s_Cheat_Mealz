// GST settings against the Firestore EMULATOR (npm run test:emulator), with the REAL firestore.rules and the REAL resolveServerTax:
//   A. RBAC on who may write miscellaneous/settings (genuine positive + negative controls) and the gstRateBp value guard,
//   B. resolveServerTax on the real document shapes (including the live one: gstRate 0.05 only) and a restored old snapshot.
import { test, before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore'
import { resolveServerTax } from '../api/_lib/gst.js'

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Refusing to run without the Firestore emulator (npm run test:emulator)')
const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':')
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8')
const SUPERADMIN = 'swastiksaha1204@gmail.com'
let env, adminDb

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-venkys-gst', firestore: { host, port: Number(port), rules } })
  const require = createRequire(import.meta.url)
  const { initializeApp, getApps } = require('firebase-admin/app')
  const { getFirestore } = require('firebase-admin/firestore')
  if (!getApps().length) initializeApp({ projectId: 'demo-venkys-gst' })
  adminDb = getFirestore()
})
after(async () => { await env?.cleanup() })
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'miscellaneous/settings'), { gstRate: 0.05, shopPhone: '1234567890' })   // the LIVE shape
    await setDoc(doc(db, 'roles/settings-staff@example.com'), { role: 'staff', pages: { settings: true } })
    await setDoc(doc(db, 'roles/other-staff@example.com'), { role: 'staff', pages: { orders: true } })
    await setDoc(doc(db, 'roles/boss@example.com'), { role: 'admin' })
  })
})

const as = (email) => env.authenticatedContext(`uid-${email}`, { email, email_verified: true }).firestore()
const anon = () => env.unauthenticatedContext().firestore()
const settings = (db) => doc(db, 'miscellaneous/settings')

// ── A. RBAC ─────────────────────────────────────────────────────────────────────────────────────────────────────────

test('A1 NEGATIVE controls: anon, a customer, and staff WITHOUT the settings page cannot write gstRateBp / gstEnabled', async () => {
  for (const [who, db] of [['anon', anon()], ['customer', as('cust@example.com')], ['staff without settings', as('other-staff@example.com')]]) {
    await assertFails(updateDoc(settings(db), { gstRateBp: 500 }))
    await assertFails(updateDoc(settings(db), { gstEnabled: true }))
    await assertFails(setDoc(settings(db), { gstRateBp: 500 }, { merge: true }))
    void who
  }
  await env.withSecurityRulesDisabled(async (c) => {
    const d = (await getDoc(settings(c.firestore()))).data()
    assert.equal(d.gstRateBp, undefined); assert.equal(d.gstEnabled, undefined)
  })
})

test('A2 POSITIVE controls: staff WITH the settings page, an admin and the superadmin CAN write a valid rate (so the denials above are real)', async () => {
  for (const email of ['settings-staff@example.com', 'boss@example.com', SUPERADMIN]) {
    await assertSucceeds(updateDoc(settings(as(email)), { gstRateBp: 500, gstEnabled: false }))
  }
})

test('A3 the value guard: only a whole number of basis points in 1..2800 is accepted, even from an admin', async () => {
  const admin = as('boss@example.com')
  for (const bad of [5.5, 0.05, 0, -500, 2801, 100000, '500', null, NaN, true]) {
    await assertFails(updateDoc(settings(admin), { gstRateBp: bad }))
    await assertFails(setDoc(settings(admin), { gstRateBp: bad }, { merge: true }))
  }
  for (const ok of [1, 250, 500, 1200, 1800, 2800]) await assertSucceeds(updateDoc(settings(admin), { gstRateBp: ok }))
  await assertSucceeds(updateDoc(settings(admin), { shopPhone: '9999999999' }))   // a write that does not touch gstRateBp is unaffected
})

test('A4 other miscellaneous docs are unaffected by the settings guard', async () => {
  await assertSucceeds(setDoc(doc(as('boss@example.com'), 'miscellaneous/store'), { open: true }))
  await assertFails(setDoc(doc(as('other-staff@example.com'), 'miscellaneous/store'), { open: true }))
})

// ── B. resolveServerTax on real document shapes (Admin SDK, like place-order) ───────────────────────────────────────

const put = (data) => adminDb.doc('miscellaneous/settings').set(data)

test('B1 the LIVE document (gstRate 0.05, no gstEnabled) yields no tax: behaviour unchanged', async () => {
  await put({ gstRate: 0.05 })
  assert.deepEqual(await resolveServerTax(adminDb, 1000), { taxRateBp: null, taxAmount: null })
})

test('B2 enabled + gstRateBp 500 taxes 5% exactly; a missing settings doc means no tax', async () => {
  await put({ gstEnabled: true, gstRateBp: 500 })
  assert.deepEqual(await resolveServerTax(adminDb, 1000), { taxRateBp: 500, taxAmount: 50 })
  assert.deepEqual(await resolveServerTax(adminDb, 10), { taxRateBp: 500, taxAmount: 1 })
  await adminDb.doc('miscellaneous/settings').delete()
  assert.deepEqual(await resolveServerTax(adminDb, 1000), { taxRateBp: null, taxAmount: null })
})

test('B3 a RESTORED old snapshot (change-history restore = setDoc merge:false with the legacy gstRate) cannot silently mis-tax: the rate is simply absent => no tax', async () => {
  await put({ gstEnabled: true, gstRateBp: 500 })
  assert.equal((await resolveServerTax(adminDb, 1000)).taxAmount, 50)
  // exactly what restoreVersion() does with a stored "before" snapshot that predates gstRateBp:
  await adminDb.doc('miscellaneous/settings').set({ gstEnabled: true, gstRate: 0.05 })
  assert.deepEqual(await resolveServerTax(adminDb, 1000), { taxRateBp: null, taxAmount: null })
  // and an in-place representation change would NOT have been safe: 0.05 read as basis points is rejected, never applied
  await adminDb.doc('miscellaneous/settings').set({ gstEnabled: true, gstRateBp: 0.05 })
  assert.deepEqual(await resolveServerTax(adminDb, 1000), { taxRateBp: null, taxAmount: null })
})

test('B4 invalid stored rates are ignored (no tax), never coerced: float, string, zero, above 28%', async () => {
  for (const bad of [5.5, '500', 0, -1, 2801, null]) {
    await put({ gstEnabled: true, gstRateBp: bad })
    assert.deepEqual(await resolveServerTax(adminDb, 1000), { taxRateBp: null, taxAmount: null }, String(bad))
  }
})
