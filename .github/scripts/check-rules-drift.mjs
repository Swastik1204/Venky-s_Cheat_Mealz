#!/usr/bin/env node
/**
 * Fail if the LIVE deployed Firestore ruleset differs from the committed
 * firestore.rules in the current checkout.
 *
 * Part of the unified CI template — this file is identical in all four repos
 * (Blobby, Venky's, cafe_mvp, FSW), same as .github/workflows/deploy.yml below
 * its PROJECT CONFIG block. Run by the "Firestore Rules Deployed" job.
 *
 * Closes the gap that let Venky's run 10.5 days on stale production rules
 * undetected (Venky's memory.md §5): the existing rules-check only compares a
 * repo's own rules files to EACH OTHER, never to what is actually deployed.
 *
 * The workflow checks out the right ref before calling this:
 *   - push to main/prod : the pushed commit  -> "did this push's deploy ship rules?"
 *   - PR to main/prod    : the PR's base sha -> "has the target branch drifted from live?"
 *     (base, not head, so the PR's own rule changes never false-positive)
 *
 * Usage:
 *   node check-rules-drift.mjs --project <id> --rules <path/to/firestore.rules>
 *
 * Auth (in order):
 *   1. --access-token <tok>                     (local testing only)
 *   2. GOOGLE_APPLICATION_CREDENTIALS -> a service-account JSON file, written by
 *      the workflow's "Write service-account credentials" step. Same key that
 *      DEPLOYS the rules, so it can always read them (roles/firebaserules.admin
 *      includes firebaserules.releases.get + firebaserules.rulesets.get).
 */

import fs from 'node:fs';
import crypto from 'node:crypto';
import https from 'node:https';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
function fail(msg) {
  console.error(`::error::${msg}`);
  process.exit(1);
}

const PROJECT = arg('--project') || process.env.FIREBASE_PROJECT_ID;
const RULES_PATH = arg('--rules');
if (!PROJECT || !RULES_PATH) fail('Usage: check-rules-drift.mjs --project <id> --rules <path>');

function httpReq(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(new URL(url), { method, headers: { ...headers } }, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        let parsed;
        try { parsed = buf ? JSON.parse(buf) : {}; } catch { parsed = { _raw: buf }; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

const b64url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function tokenFromServiceAccount(saPath) {
  const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  const tokenUri = sa.token_uri || 'https://oauth2.googleapis.com/token';
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.readonly',
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  };
  const signingInput =
    `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify(claim))}`;
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(signingInput)
    .sign(sa.private_key.replace(/\\n/g, '\n'));
  const assertion = `${signingInput}.${b64url(signature)}`;

  const { status, body } = await httpReq(
    'POST',
    tokenUri,
    { 'Content-Type': 'application/x-www-form-urlencoded' },
    `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${encodeURIComponent(assertion)}`
  );
  if (status !== 200 || !body.access_token) fail(`OAuth token exchange failed (${status}): ${JSON.stringify(body)}`);
  return body.access_token;
}

// LF-normalise + strip trailing whitespace per line + collapse trailing blank
// lines. Tolerates a cosmetic CRLF round-trip from a local `firebase deploy` on
// Windows without masking any real rule change.
const normalize = (s) => s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n+$/, '\n');

(async () => {
  let token = arg('--access-token');
  if (!token) {
    const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!saPath || !fs.existsSync(saPath)) {
      fail('No --access-token and GOOGLE_APPLICATION_CREDENTIALS is unset or missing.');
    }
    token = await tokenFromServiceAccount(saPath);
  }
  const auth = { Authorization: `Bearer ${token}` };

  const rel = await httpReq(
    'GET',
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases/cloud.firestore`,
    auth
  );
  if (rel.status === 404) {
    fail(
      `No cloud.firestore release for "${PROJECT}" — Firestore rules have NEVER been deployed. ` +
      `Merge to a branch that runs deploy-staging / deploy-production.`
    );
  }
  if (rel.status !== 200 || !rel.body.rulesetName) {
    fail(`Could not read the cloud.firestore release (${rel.status}): ${JSON.stringify(rel.body)}`);
  }

  const rs = await httpReq('GET', `https://firebaserules.googleapis.com/v1/${rel.body.rulesetName}`, auth);
  if (rs.status !== 200 || !rs.body.source || !Array.isArray(rs.body.source.files)) {
    fail(`Could not read ruleset ${rel.body.rulesetName} (${rs.status}): ${JSON.stringify(rs.body)}`);
  }

  const files = rs.body.source.files;
  const file =
    files.length === 1
      ? files[0]
      : files.find((f) => f.name === 'firestore.rules' || f.name.endsWith('/firestore.rules'));
  if (!file) {
    fail(`Deployed ruleset has ${files.length} files, none named firestore.rules: ${files.map((f) => f.name).join(', ')}`);
  }

  const deployed = normalize(file.content);
  const committed = normalize(fs.readFileSync(RULES_PATH, 'utf8'));
  const rulesetId = rel.body.rulesetName.split('/').pop();

  if (deployed === committed) {
    console.log(`OK — live ${PROJECT} cloud.firestore ruleset ${rulesetId} matches ${RULES_PATH} (${committed.split('\n').length} lines).`);
    return;
  }

  const d = deployed.split('\n');
  const c = committed.split('\n');
  console.error('::group::Deployed (live) vs committed firestore.rules — first differing lines');
  let shown = 0;
  for (let i = 0; i < Math.max(d.length, c.length) && shown < 100; i++) {
    if (d[i] !== c[i]) {
      console.error(`  L${i + 1}`);
      console.error(`    live:      ${d[i] ?? '(no line)'}`);
      console.error(`    committed: ${c[i] ?? '(no line)'}`);
      shown++;
    }
  }
  console.error('::endgroup::');
  fail(
    `Deployed ${PROJECT} Firestore rules do NOT match ${RULES_PATH}. Either a rules change was never ` +
    `deployed, or the deploy step silently stopped shipping rules (the 2026-08-24 class of gap). ` +
    `Live ruleset: ${rel.body.rulesetName}`
  );
})().catch((e) => fail(`Unexpected error: ${e && e.stack ? e.stack : e}`));
