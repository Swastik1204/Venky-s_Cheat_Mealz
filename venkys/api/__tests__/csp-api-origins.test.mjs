// Guard: each Firebase Hosting site's Content-Security-Policy must allow the API origin
// that site's own code calls, or the browser blocks EVERY API request from that site
// (checkout, invites, mail...). This shipped broken on 2026-09-10 (a CSP with a connect-src
// that never listed the Vercel API hosts) and nothing noticed.
//
// Run: node --test venkys/api/__tests__/csp-api-origins.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const firebase = JSON.parse(read('../../../firebase.json'));

const connectSrc = (target) => {
  const site = firebase.hosting.find((h) => h.target === target);
  assert.ok(site, `hosting target ${target} exists`);
  const csp = site.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy');
  assert.ok(csp, `${target} sets a Content-Security-Policy`);
  const directive = csp.value.split(';').map((d) => d.trim()).find((d) => d.startsWith('connect-src '));
  assert.ok(directive, `${target} has a connect-src directive`);
  return directive.split(/\s+/).slice(1);
};

// The production API base each app falls back to in its apiUrl() (data-common.js).
const productionBase = (rel) => {
  const m = /const productionBase = '([^']+)'/.exec(read(rel));
  assert.ok(m, `productionBase found in ${rel}`);
  return m[1];
};

const apps = [
  ['venkys-customer', '../../src/lib/data-common.js'],
  ['venkys-admin', '../../../venkys_admin/src/lib/data-common.js'],
];

for (const [target, source] of apps) {
  test(`${target}: connect-src allows the API origin the app calls`, () => {
    const base = productionBase(source);
    assert.ok(connectSrc(target).includes(base), `${target} connect-src must include ${base}`);
  });
}

test('the CSP does not fall back to a wildcard that would defeat it', () => {
  for (const [target] of apps) {
    assert.ok(!connectSrc(target).some((s) => s === '*' || s === 'https:'), `${target} connect-src must not be a bare wildcard`);
  }
});
