#!/usr/bin/env node
/**
 * pnpm check:ownership [--base <ref>] [--track UI-F2] [--cross-track]
 *
 * SDD-01T §3.8: on a branch `ui/<track>/…` every changed file under apps/web must match the
 * track's globs in tracks.json (or the shared paths). `--cross-track` (set by CI from the PR
 * label) turns violations into warnings. On other branches the check is skipped.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { minimatch } from 'minimatch';

const args = process.argv.slice(2);
const opt = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const crossTrack = args.includes('--cross-track') || process.env.CROSS_TRACK === '1';
const config = JSON.parse(readFileSync(new URL('../tracks.json', import.meta.url), 'utf8'));

const branch = process.env.GITHUB_HEAD_REF || process.env.BRANCH_NAME || execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
const track = opt('track') ?? /^ui\/([A-Z0-9-]+)\//i.exec(branch)?.[1]?.toUpperCase();
if (!track) {
  console.log(`[check:ownership] branch "${branch}" is not a track branch (ui/<track>/…) — skipped`);
  process.exit(0);
}
const def = config.tracks[track];
if (!def) {
  console.error(`[check:ownership] unknown track "${track}" (see tracks.json)`);
  process.exit(1);
}

const base = opt('base') ?? process.env.GITHUB_BASE_REF ?? 'origin/main';
let changed;
try {
  changed = execSync(`git diff --name-only ${base}...HEAD -- apps/web`, { encoding: 'utf8' }).split('\n').filter(Boolean);
} catch {
  changed = execSync('git diff --name-only HEAD~1 -- apps/web', { encoding: 'utf8' }).split('\n').filter(Boolean);
}
const allowed = [...def.paths, ...config.shared.paths];
const violations = changed.map((f) => f.replace(/^apps\/web\//, '')).filter((f) => !allowed.some((g) => minimatch(f, g, { dot: true, matchBase: false })));

if (violations.length) {
  const owner = (f) => Object.entries(config.tracks).find(([, t]) => t.paths.some((g) => minimatch(f, g, { dot: true })))?.[0] ?? '—';
  console[crossTrack ? 'warn' : 'error'](`[check:ownership] ${track} touches paths it does not own${crossTrack ? ' (cross-track PR, allowed)' : ''}:`);
  for (const f of violations) console[crossTrack ? 'warn' : 'error'](`  ${f}  (owner: ${owner(f)})`);
  if (!crossTrack) {
    console.error('\nUse a request file in docs/requests/ or label the PR "cross-track" with approval of the owners.');
    process.exit(1);
  }
}
console.log(`[check:ownership] ${track}: ${changed.length} changed file(s), ${violations.length} outside ownership`);
