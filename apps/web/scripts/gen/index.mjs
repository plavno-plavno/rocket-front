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

const check = process.argv.includes('--check');
const quiet = process.argv.includes('--quiet');
const report = new GenReport();

const messages = generateMessages(report);
const mocks = generateMockRegistry(report);

if (!quiet) {
  console.log(`[gen] messages: shell + ${messages.length} feature namespace(s) (${messages.join(', ') || '—'})`);
  console.log(`[gen] mock registry: ${mocks.length} feature(s) (${mocks.join(', ') || '—'})`);
  for (const o of report.outputs) console.log(`[gen] ${o.changed ? 'wrote' : 'unchanged'} ${o.path}`);
}
for (const w of report.warnings) console.warn(`[gen] warning: ${w}`);
for (const e of report.errors) console.error(`[gen] error: ${e}`);
if (report.errors.length) {
  console.error(`[gen] ${report.errors.length} error(s)`);
  process.exit(check ? 1 : 0);
}
