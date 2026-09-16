// Fails when src/generated is out of date with openapi/core-api.yaml.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const target = new URL('../src/generated/core-api.d.ts', import.meta.url);
const before = readFileSync(target, 'utf8');
execSync('pnpm gen', { stdio: 'inherit', cwd: new URL('..', import.meta.url) });
const after = readFileSync(target, 'utf8');
if (before !== after) {
  writeFileSync(target, before);
  console.error('\n@lp/contracts: generated types are stale. Run `pnpm --filter @lp/contracts gen` and commit.');
  process.exit(1);
}
console.log('@lp/contracts: generated types are up to date.');
