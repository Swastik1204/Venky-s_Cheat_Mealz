// GST as integer basis points: the parser, the exact tax math, and equivalence with the legacy float formula. No Firestore needed.
// Run: node --test api/__tests__/gst-rate.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseGstRateBp, taxFor, resolveServerTax, MAX_GST_BP } from '../_lib/gst.js'

const here = dirname(fileURLToPath(import.meta.url))

test('gst.js and money.js copies are byte-identical (venkys, venkys_admin)', () => {
  for (const f of ['api/_lib/gst.js', 'src/lib/money.js']) {
    assert.equal(readFileSync(join(here, '../..', f), 'utf8'), readFileSync(join(here, '../../../venkys_admin', f), 'utf8'), f)
  }
})

test('parseGstRateBp: tax is off unless explicitly enabled AND the rate is an in-range integer of basis points', () => {
  assert.equal(parseGstRateBp({ gstEnabled: true, gstRateBp: 500 }), 500)
  assert.equal(parseGstRateBp({ gstEnabled: true, gstRateBp: 2800 }), 2800)
  assert.equal(parseGstRateBp({ gstEnabled: true, gstRateBp: 1 }), 1)
  const off = [
    { gstRateBp: 500 },                                   // never enabled: today's live behaviour
    { gstEnabled: false, gstRateBp: 500 }, { gstEnabled: 'true', gstRateBp: 500 }, { gstEnabled: 1, gstRateBp: 500 },
    { gstEnabled: true },                                  // no rate
    { gstEnabled: true, gstRate: 0.05 },                  // ONLY the legacy field (exactly the live document, or a restored old snapshot)
    { gstEnabled: true, gstRate: 500 },
    { gstEnabled: true, gstRateBp: 0.05 }, { gstEnabled: true, gstRateBp: 5.5 }, { gstEnabled: true, gstRateBp: '500' },
    { gstEnabled: true, gstRateBp: 0 }, { gstEnabled: true, gstRateBp: -500 }, { gstEnabled: true, gstRateBp: MAX_GST_BP + 1 },
    { gstEnabled: true, gstRateBp: NaN }, { gstEnabled: true, gstRateBp: Infinity }, { gstEnabled: true, gstRateBp: null },
    null, undefined, 5, 'x', [],
  ]
  for (const d of off) assert.equal(parseGstRateBp(d), null, JSON.stringify(d))
})

test('taxFor is the exact half-up amount and never rounds an intermediate', () => {
  assert.equal(taxFor(1000, 500), 50)
  assert.equal(taxFor(10, 500), 1)     // 0.5 rounds half up
  assert.equal(taxFor(9, 500), 0)      // 0.45
  assert.equal(taxFor(30, 500), 2)     // 1.5
  assert.equal(taxFor(0, 500), 0)
  assert.equal(taxFor(299, 1800), 54)  // 53.82
  assert.throws(() => taxFor(-1, 500))
  assert.throws(() => taxFor(10.5, 500))
})

test('DIFFERENTIAL: exact tax equals the legacy Math.round(subtotal * fraction) for every subtotal 0..60000 at every real GST slab', () => {
  // The legacy formula, verbatim: Math.round(subtotal * rate) with rate the float fraction (0.05, 0.12, ...).
  const slabs = [[0.05, 500], [0.12, 1200], [0.18, 1800], [0.28, 2800], [0.025, 250], [0.0525, 525]]
  const mismatches = []
  for (const [rate, bp] of slabs) {
    assert.equal(bp / 10000, rate, `bp ${bp} maps back to the float fraction ${rate}`)
    for (let subtotal = 0; subtotal <= 60000; subtotal++) {
      const legacy = Math.round(subtotal * rate)
      const exact = taxFor(subtotal, bp)
      if (legacy !== exact) mismatches.push({ rate, subtotal, legacy, exact })
    }
  }
  console.log(`   differential: ${slabs.length * 60001} comparisons, ${mismatches.length} mismatches`, mismatches.slice(0, 3))
  assert.deepEqual(mismatches, [], 'any difference is a float-error tie the exact math resolves; investigate before accepting')
})

test('resolveServerTax fails closed (no tax, order still proceeds) when the settings read throws', async () => {
  const boom = { collection: () => ({ doc: () => ({ get: () => Promise.reject(new Error('firestore down')) }) }) }
  assert.deepEqual(await resolveServerTax(boom, 1000), { taxRateBp: null, taxAmount: null })
})
