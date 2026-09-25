// Run with: node --test <path to this file>. KEEP BYTE-IDENTICAL in every copy (a companion test compares the copies).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MoneyError, MAX_PAISE, ZERO, add, assertPaise, balance, fromFraction, fromRupeeInput, growthPct, isPaise, mul, paise, pct,
  ratioPct, splitTax, sub, toDisplay,
} from '../money.js';

test('assertPaise accepts only non-negative safe integers within the ceiling', () => {
  for (const ok of [0, 1, 12345, MAX_PAISE]) assert.doesNotThrow(() => assertPaise(ok));
  for (const bad of [123.456, 0.5, -1, NaN, Infinity, '100', null, undefined, {}, MAX_PAISE + 1, 2 ** 53]) {
    assert.throws(() => assertPaise(bad, 'rate'), (e) => e instanceof MoneyError && e.message.startsWith('rate'), typeof bad);
  }
  assert.equal(isPaise(5), true);
  assert.equal(isPaise(5.5), false);
  assert.equal(paise(7), 7);
  assert.throws(() => paise(7.5), MoneyError);
});

test('a bug that produces fractional paise fails loudly instead of rounding somewhere downstream', () => {
  assert.throws(() => assertPaise(1234.56 * 1.05, 'total'), /whole number of paise/);
  assert.throws(() => assertPaise(0.1 + 0.2, 'total'), /whole number of paise/);
});

test('add / sub / mul are exact integer arithmetic; sub refuses a negative result; inputs are guarded', () => {
  assert.equal(add(10, 20, 3), 33);
  assert.equal(add(), 0);
  assert.equal(sub(100, 1), 99);
  assert.throws(() => sub(1, 2), MoneyError);
  assert.equal(mul(3333, 4), 13332);
  assert.throws(() => mul(1, 1.5), MoneyError);
  assert.throws(() => mul(1, -1), MoneyError);
  assert.throws(() => add(1, 2.5), MoneyError, 'a decimal cannot slip into a sum');
  assert.throws(() => add(1.5, 1.5), MoneyError, 'two decimals that happen to sum to a whole number are still refused');
  assert.throws(() => mul(33.33, 3), MoneyError, 'a rupee decimal cannot slip into a line total');
  assert.equal(ZERO, 0);
});

test('balance is signed and exact', () => {
  assert.equal(balance(100, 30), 70);
  assert.equal(balance(100, 130), -30);
  assert.throws(() => balance(1.5, 1), MoneyError);
});

test('fromRupeeInput parses exactly, with no float error', () => {
  const cases = [
    ['0', 0], ['123', 12300], ['123.4', 12340], ['123.45', 12345], ['0.05', 5], ['1,234.50', 123450],
    ['₹99.00', 9900], ['  10 ', 1000], ['19.99', 1999], ['0.29', 29], ['1.15', 115], ['1.00', 100],
  ];
  for (const [input, want] of cases) assert.equal(fromRupeeInput(input), want, input);
});

test('fromRupeeInput rejects anything that is not a plain amount (never rounds a typo)', () => {
  for (const bad of ['', ' ', 'abc', '-5', '1e3', '1.005', '12.345', '1.', '.5', '1 2', '₹', '5%', '0x10', '1,2,3.456', 12.5, null]) {
    assert.throws(() => fromRupeeInput(bad), MoneyError, JSON.stringify(bad));
  }
  assert.throws(() => fromRupeeInput('999999999999999'), MoneyError, 'above the ceiling');
});

test('toDisplay formats with Indian grouping and always two decimals', () => {
  assert.equal(toDisplay(0), '₹0.00');
  assert.equal(toDisplay(5), '₹0.05');
  assert.equal(toDisplay(12345), '₹123.45');
  assert.equal(toDisplay(123450), '₹1,234.50');
  assert.equal(toDisplay(12345678900), '₹12,34,56,789.00');
  for (const n of [0, 1, 99, 100, 101, 999999, 123456789]) assert.equal(fromRupeeInput(toDisplay(n)), n, `round trip ${String(n)}`);
  assert.throws(() => toDisplay(12.5), MoneyError, 'a rupee decimal is never formatted as if it were paise');
});

test('pct rounds half up, once, exactly', () => {
  assert.equal(pct(1000, 2.5), 25);
  assert.equal(pct(10, 50), 5);
  assert.equal(pct(1, 50), 1, '0.5 paisa rounds UP to 1');
  assert.equal(pct(3, 50), 2, '1.5 rounds up to 2');
  assert.equal(pct(1, 49.99), 0);
  assert.equal(pct(1999, 18), 360, '359.82 -> 360');
  assert.equal(pct(1005, 10), 101, '100.5 -> 101 (a float 1005*0.1 would mis-round)');
  assert.equal(pct(0, 18), 0);
  assert.equal(pct(MAX_PAISE, 100), MAX_PAISE, 'no overflow at the ceiling');
  assert.equal(pct(MAX_PAISE, 12.5), MAX_PAISE / 8);
  assert.throws(() => pct(100, 2.555), /at most 2 decimal/);
  assert.throws(() => pct(100, -1), MoneyError);
  assert.throws(() => pct(100, NaN), MoneyError);
  assert.throws(() => pct(MAX_PAISE, 101), /implausibly large/, 'the result is guarded too');
  assert.throws(() => pct(10.5, 10), MoneyError, 'a decimal base is refused');
});

test('fromFraction is exact and half up', () => {
  assert.equal(fromFraction(1000, 1, 3), 333);
  assert.equal(fromFraction(1000, 2, 3), 667);
  assert.equal(fromFraction(1, 1, 2), 1);
  assert.equal(fromFraction(5, 3, 10), 2, '1.5 -> 2');
  assert.throws(() => fromFraction(1, 1, 0), MoneyError);
  assert.throws(() => fromFraction(1, 0.5, 2), MoneyError);
  assert.throws(() => fromFraction(1, -1, 2), MoneyError);
});

test('splitTax always sums back to the tax it split (the odd paisa goes to SGST)', () => {
  for (const t of [0, 1, 2, 3, 359, 360, 1801]) {
    const { cgst, sgst } = splitTax(t);
    assert.equal(cgst + sgst, t);
    assert.ok(sgst - cgst === 0 || sgst - cgst === 1);
  }
  assert.deepEqual(splitTax(5), { cgst: 2, sgst: 3 });
});

test('ratioPct and growthPct return plain rates, two decimals', () => {
  assert.equal(ratioPct(1, 3), 33.33);
  assert.equal(ratioPct(2, 3), 66.67);
  assert.equal(ratioPct(5, 0), 0);
  assert.equal(growthPct(150, 100), 50);
  assert.equal(growthPct(50, 100), -50);
  assert.equal(growthPct(101, 3), 3266.67);
  assert.equal(growthPct(1, 3), -66.67);
  assert.equal(growthPct(100, 0), null, 'no previous figure to compare with');
  assert.equal(growthPct(100, 100), 0);
});
