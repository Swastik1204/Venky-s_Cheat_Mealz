/**
 * The single source of truth for money (plain-JS port of fsw-dgp's functions/src/lib/money.ts: same contract).
 * Every price, fee, amount, cost and ledger figure is an INTEGER number of paise ("Paise"), in memory and in Firestore:
 * never a rupee decimal, never a string.
 *
 * Only this file converts between representations or does percentage / ratio math:
 *  - toDisplay(paise)          -> "₹1,234.50"   (formatting only, for UI)
 *  - fromRupeeInput(string)    -> paise         (parsing only, for a human typing "123.45")
 *  - pct / fromFraction / splitTax               (percentage math ON money, half-up, once per line)
 *  - ratioPct / growthPct                        (rates FROM money: plain numbers, never written as money)
 * Everything else is exact integer arithmetic (add, sub, mul). No other file may write `* 100` / `/ 100` on money
 * (enforced by the no-restricted-syntax rule in eslint.config.js).
 *
 * Rounding: round half up, applied ONCE to the final value of a line, never to an intermediate. All rounding is done in
 * BigInt so it is exact (no float error, e.g. 1.005 * 100).
 * Percentages are the caller's rate (2.5, 18, 0.25...) and may have at most 2 decimals; anything finer is rejected.
 *
 * KEEP THIS FILE BYTE-IDENTICAL in every copy (each repo/app carries one; a test compares them).
 *
 * @typedef {number} Paise  a non-negative safe integer count of paise (JS has no brand: use assertPaise/paise at boundaries)
 * @typedef {number} SignedPaise  an integer count of paise that MAY be negative: only for a balance (owed minus paid)
 */

/** Ceiling on any single money value: 100 crore rupees. A larger figure is a bug (unit mix-up), not a price. */
export const MAX_PAISE = 10_000_000_000_000;

export class MoneyError extends Error {
  /** @param {string} message */
  constructor(message) { super(message); this.name = 'MoneyError'; }
}

/** @param {unknown} v @returns {boolean} */
export function isPaise(v) {
  return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= MAX_PAISE;
}

/**
 * The write guard: throws unless v is a non-negative integer paise value within the ceiling.
 * @param {unknown} v @param {string} [field]
 */
export function assertPaise(v, field = 'amount') {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new MoneyError(`${field} must be an integer number of paise`);
  if (!Number.isInteger(v)) throw new MoneyError(`${field} must be a whole number of paise (got ${String(v)})`);
  if (v < 0) throw new MoneyError(`${field} must not be negative`);
  if (v > MAX_PAISE) throw new MoneyError(`${field} is implausibly large (${String(v)} paise)`);
}

/** Returns v when it is integer paise (throws otherwise). @param {unknown} v @param {string} [field] @returns {Paise} */
export function paise(v, field = 'amount') {
  assertPaise(v, field);
  return /** @type {number} */ (v);
}

/** @type {Paise} */
export const ZERO = 0;

/** a - b as a signed balance (negative = overpaid). Exact. @param {Paise} a @param {Paise} b @returns {SignedPaise} */
export function balance(a, b) {
  assertPaise(a, 'a'); assertPaise(b, 'b');
  return a - b;
}

// ── exact integer arithmetic ────────────────────────────────────────────────────────────────────────────────────

/** @param {...Paise} parts @returns {Paise} */
export function add(...parts) {
  let sum = 0;
  for (const p of parts) { assertPaise(p, 'addend'); sum += p; }
  return paise(sum, 'sum');
}
/** @param {Paise} a @param {Paise} b @returns {Paise} */
export function sub(a, b) {
  assertPaise(a, 'a'); assertPaise(b, 'b');
  if (b > a) throw new MoneyError(`cannot subtract ${String(b)} from ${String(a)} paise (result would be negative)`);
  return a - b;
}
/** Unit price x a whole quantity. @param {Paise} unit @param {number} qty @returns {Paise} */
export function mul(unit, qty) {
  assertPaise(unit, 'unit price');
  if (!Number.isSafeInteger(qty) || qty < 0) throw new MoneyError('quantity must be a non-negative integer');
  return paise(unit * qty, 'line total');
}

// ── rounding (BigInt: exact) ────────────────────────────────────────────────────────────────────────────────────

/** round-half-up(num / den) for non-negative BigInts. @param {bigint} num @param {bigint} den @returns {bigint} */
function divHalfUp(num, den) {
  return (2n * num + den) / (2n * den);
}

/** A rate like 2.5 or 18 as an integer number of basis points (hundredths of a percent). At most 2 decimals. */
function toBasisPoints(/** @type {number} */ percentage, /** @type {string} */ field) {
  if (!Number.isFinite(percentage) || percentage < 0) throw new MoneyError(`${field} must be a non-negative percentage`);
  const bp = Math.round(percentage * 100);
  if (Math.abs(bp - percentage * 100) > 1e-6) throw new MoneyError(`${field} may have at most 2 decimal places (got ${String(percentage)})`);
  return BigInt(bp);
}

/** `percentage`% of a money value, rounded half up (discount, GST, fee). pct(1000, 2.5) = 25. @param {Paise} value @param {number} percentage @returns {Paise} */
export function pct(value, percentage) {
  assertPaise(value, 'value');
  return paise(Number(divHalfUp(BigInt(value) * toBasisPoints(percentage, 'percentage'), 10_000n)), 'percentage result');
}

/** value x numerator / denominator, rounded half up (proportional split, pro-rata share). @param {Paise} value @param {number} numerator @param {number} denominator @returns {Paise} */
export function fromFraction(value, numerator, denominator) {
  assertPaise(value, 'value');
  if (!Number.isSafeInteger(numerator) || numerator < 0) throw new MoneyError('numerator must be a non-negative integer');
  if (!Number.isSafeInteger(denominator) || denominator <= 0) throw new MoneyError('denominator must be a positive integer');
  return paise(Number(divHalfUp(BigInt(value) * BigInt(numerator), BigInt(denominator))), 'fraction result');
}

/** Splits one tax amount into CGST + SGST that always sum back to it exactly (the odd paisa goes to SGST). @param {Paise} tax @returns {{cgst: Paise, sgst: Paise}} */
export function splitTax(tax) {
  assertPaise(tax, 'tax');
  const cgst = Math.floor(tax / 2);
  return { cgst, sgst: tax - cgst };
}

// ── rates FROM money: plain numbers (not money, never written to a money field) ────────────────────────────────

/** part as a percentage of whole (e.g. cancelled revenue share), 2 decimals; 0 when whole is 0. @param {Paise} part @param {Paise} whole @returns {number} */
export function ratioPct(part, whole) {
  assertPaise(part, 'part'); assertPaise(whole, 'whole');
  if (whole === 0) return 0;
  return Number(divHalfUp(BigInt(part) * 10_000n, BigInt(whole))) / 100;
}

/** Growth from previous to current in percent, 2 decimals; null when there is no previous figure. @param {Paise} current @param {Paise} previous @returns {number | null} */
export function growthPct(current, previous) {
  assertPaise(current, 'current'); assertPaise(previous, 'previous');
  if (previous === 0) return null;
  const diff = BigInt(current) - BigInt(previous);
  const bp = diff < 0n ? -divHalfUp(-diff * 10_000n, BigInt(previous)) : divHalfUp(diff * 10_000n, BigInt(previous));
  return Number(bp) / 100;
}

// ── the two representation converters ───────────────────────────────────────────────────────────────────────────

/** "₹1,234.50" (Indian digit grouping, always 2 decimals). Formatting only: never parse this back. @param {Paise} p @returns {string} */
export function toDisplay(p) {
  assertPaise(p, 'amount');
  const whole = Math.floor(p / 100);
  const frac = String(p - whole * 100).padStart(2, '0');
  return `₹${new Intl.NumberFormat('en-IN').format(whole)}.${frac}`;
}

/**
 * Parses what a human typed in a rupee field ("123", "123.4", "1,234.50", "₹99.00") into paise, exactly, with no float
 * math. Rejects more than 2 decimals, negatives, exponents and anything that is not a plain amount.
 * @param {string} input @returns {Paise}
 */
export function fromRupeeInput(input) {
  if (typeof input !== 'string') throw new MoneyError('rupee input must be a string');
  const cleaned = input.trim().replace(/^₹\s*/, '').replace(/,/g, '');
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!m) throw new MoneyError(`"${input}" is not a valid rupee amount`);
  const rupees = m[1] ?? '0';
  const paisePart = (m[2] ?? '').padEnd(2, '0');
  return paise(Number(BigInt(rupees) * 100n + BigInt(paisePart)), 'amount');
}
