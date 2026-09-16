#!/usr/bin/env node
/**
 * pnpm gen            → (re)build src/generated/*
 * pnpm gen --check    → same, exit 1 on validation errors (CI)
 *
 * Generators live in scripts/gen/*.mjs; each receives a GenReport and returns what it found.
 * SDD-01T §3.2.
 */
import { GenReport } from './lib.mjs';
import { generateMessages } from './messages.mjs';
import { generateMockRegistry } from './mock-registry.mjs';
import { generateFeatureRegistry } from './feature-registry.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const check = process.argv.includes('--check');
const quiet = process.argv.includes('--quiet');
const report = new GenReport();

const messages = generateMessages(report);
const mocks = generateMockRegistry(report);
const feats = generateFeatureRegistry(report);

if (!quiet) {
  console.log(`[gen] messages: shell + ${messages.length} feature namespace(s) (${messages.join(', ') || '—'})`);
  console.log(`[gen] mock registry: ${mocks.length} feature(s) (${mocks.join(', ') || '—'})`);
  console.log(`[gen] feature registry: ${feats.length} feature(s) (${feats.join(', ') || '—'})`);
  for (const o of report.outputs) console.log(`[gen] ${o.changed ? 'wrote' : 'unchanged'} ${o.path}`);
}
for (const w of report.warnings) console.warn(`[gen] warning: ${w}`);
for (const e of report.errors) console.error(`[gen] error: ${e}`);
if (report.errors.length) {
  console.error(`[gen] ${report.errors.length} error(s)`);
  process.exit(check ? 1 : 0);
}

if (check) {
  // Registry semantics need TypeScript → run the validator under tsx.
  const validator = fileURLToPath(new URL('./validate.ts', import.meta.url));
  try {
    execFileSync('pnpm', ['exec', 'tsx', '--tsconfig', 'tsconfig.json', validator], { stdio: quiet ? ['ignore', 'ignore', 'inherit'] : 'inherit' });
  } catch {
    process.exit(1);
  }
}
