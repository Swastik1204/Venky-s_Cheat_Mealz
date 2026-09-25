// Fails unless every copy of money.js (and its test) in this repo is byte-identical: they are one module, copied per app
// because each app deploys from its own root. Run: node scripts/check-money-copies.mjs
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const apps = ['venkys', 'venkys_admin'];
let bad = 0;
for (const file of ['src/lib/money.js', 'src/lib/__tests__/money.test.mjs']) {
  const copies = apps.map((a) => ({ a, bytes: readFileSync(join(root, a, file)) }));
  const [first, ...rest] = copies;
  for (const c of rest) if (!first.bytes.equals(c.bytes)) { console.error(`DRIFT: ${file} differs between ${first.a} and ${c.a}`); bad++; }
}
if (bad === 0) console.log(`money.js copies identical across ${apps.join(', ')}`);
process.exit(bad === 0 ? 0 : 1);
