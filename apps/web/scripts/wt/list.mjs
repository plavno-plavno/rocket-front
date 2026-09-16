#!/usr/bin/env node
/** pnpm wt:list — worktrees with their ports. */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const out = execSync('git worktree list --porcelain', { encoding: 'utf8' });
for (const block of out.split('\n\n').filter(Boolean)) {
  const dir = /^worktree (.+)$/m.exec(block)?.[1];
  const branch = /^branch refs\/heads\/(.+)$/m.exec(block)?.[1] ?? '(detached)';
  const envFile = dir ? resolve(dir, 'apps/web/.env.local') : '';
  const ports = existsSync(envFile) ? (readFileSync(envFile, 'utf8').match(/WEB_PORT=(\d+)|MOCK_PORT=(\d+)/g) ?? []).join(' ') : '';
  console.log(`${branch.padEnd(32)} ${dir}  ${ports}`);
}
