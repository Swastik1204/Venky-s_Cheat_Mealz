// Server-owned GST: the rate is stored as INTEGER BASIS POINTS in miscellaneous/settings.gstRateBp (500 = 5%), never as a float
// fraction. KEEP BYTE-IDENTICAL with venkys_admin/api/_lib/gst.js (a test compares them).
//
// Why a NEW field instead of changing `gstRate` in place: venkys_admin's change-history restore does setDoc(target, oldSnapshot,
// { merge: false }), and the stored snapshots carry the legacy `gstRate: 0.05`. An in-place change to 500 would be silently
// reverted to 0.05 (read as 0.05%) by restoring any old settings entry. With a distinct, unit-named field a restored snapshot
// simply has no gstRateBp, which means NO TAX (the fail-closed direction). The legacy `gstRate` is ignored here and is retired
// in a separate, later step.
//
// Tax stays OFF unless the owner explicitly sets `gstEnabled: true` (see place-order.js for why that default is deliberate).
import { fromFraction } from '../../src/lib/money.js'

export const MAX_GST_BP = 2800 // 28%, the highest Indian GST slab: a sanity ceiling on config, not a rate

const BASIS_POINTS_PER_WHOLE = 10_000

/** The trusted basis-points rate from a settings document, or null (= no tax). Anything not an in-range integer is rejected, never coerced. */
export function parseGstRateBp(settings) {
  const d = settings && typeof settings === 'object' ? settings : {}
  if (d.gstEnabled !== true) return null
  const bp = d.gstRateBp
  if (typeof bp !== 'number' || !Number.isSafeInteger(bp) || bp < 1 || bp > MAX_GST_BP) return null
  return bp
}

/** Exact half-up tax on an integer subtotal (BigInt inside money.js: no float error). */
export function taxFor(subtotal, bp) {
  return fromFraction(subtotal, bp, BASIS_POINTS_PER_WHOLE)
}

/** { taxRateBp, taxAmount } for a verified subtotal, or nulls when tax is off, misconfigured, or the settings read failed. */
export async function resolveServerTax(db, subtotal) {
  try {
    const snap = await db.collection('miscellaneous').doc('settings').get()
    if (!snap.exists) return { taxRateBp: null, taxAmount: null }
    const bp = parseGstRateBp(snap.data())
    if (bp === null) return { taxRateBp: null, taxAmount: null }
    return { taxRateBp: bp, taxAmount: taxFor(subtotal, bp) }
  } catch (err) {
    // Never fail an order because the settings read failed: fall back to no tax, the recoverable direction (undercharging can
    // be corrected on the bill; overcharging a customer cannot be taken back).
    console.warn('[place-order] tax settings read failed, applying no tax:', err?.message)
    return { taxRateBp: null, taxAmount: null }
  }
}
