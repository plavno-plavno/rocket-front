#!/usr/bin/env node
/**
 * pnpm check:contrast — WCAG AA audit of the `lp` theme tokens (SDD-01 §12 a11y).
 * Parses src/styles/themes/lp.css, converts oklch → sRGB and checks text/background pairs:
 * ≥ 4.5:1 for normal text, ≥ 3:1 for large text / UI components (badges use small bold text → 4.5).
 */
import { readFileSync } from 'node:fs';
import { wcagContrast, parse, formatHex } from 'culori';

const css = readFileSync(new URL('../src/styles/themes/lp.css', import.meta.url), 'utf8');
const blocks = { light: /\[data-theme='lp'\] \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '', dark: /\[data-theme='lp'\]\.dark \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '' };

function tokens(block) {
  const out = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const PAIRS = [
  ['foreground', 'background', 4.5],
  ['muted-foreground', 'background', 4.5],
  ['muted-foreground', 'card', 4.5],
  ['muted-foreground', 'muted', 4.5],
  ['card-foreground', 'card', 4.5],
  ['primary-foreground', 'primary', 4.5],
  ['secondary-foreground', 'secondary', 4.5],
  ['accent-foreground', 'accent', 4.5],
  ['destructive-foreground', 'destructive', 4.5],
  ['sidebar-foreground', 'sidebar', 4.5],
  ['sidebar-primary-foreground', 'sidebar-primary', 4.5],
  ['status-synced', 'status-synced-bg', 4.5],
  ['status-sent', 'status-sent-bg', 4.5],
  ['status-action', 'status-action-bg', 4.5],
  ['status-error', 'status-error-bg', 4.5],
  ['status-neutral', 'status-neutral-bg', 4.5],
  ['status-synced', 'card', 3],
  ['status-action', 'card', 3],
  ['status-error', 'card', 3],
  ['rating-negative', 'card', 3],
  ['rating-positive', 'card', 3],
  ['primary', 'background', 3],
  ['ring', 'background', 3],
  ['border', 'background', 1.2],
  // Light theme rework (2026-09-17): edges and controls must read on white cards and the page.
  // A 4th element limits a pair to one mode; dark keeps its own, already legible, surfaces.
  ['border', 'card', 1.3, 'light'],
  ['input', 'card', 1.6, 'light'],
  ['control-border', 'card', 3, 'light'],
  ['control-border', 'muted', 3, 'light'],
  ['sidebar-accent-foreground', 'sidebar-accent', 4.5],
  ['lp-stat-label', 'lp-mint', 4.5],
  ['lp-stat-label', 'lp-blue', 4.5],
  ['lp-stat-label', 'lp-peach', 4.5],
  ['lp-stat-label', 'lp-rose', 4.5],
  ['lp-stat-label', 'lp-slate', 4.5],
  ['lp-stat-label', 'lp-violet', 4.5],
  ['lp-hero-ink', 'lp-hero', 7]
];

let failures = 0;
for (const [mode, block] of Object.entries(blocks)) {
  const light = tokens(blocks.light);
  const t = { ...light, ...tokens(block) };
  console.log(`\n${mode}`);
  for (const [fg, bg, min, only] of PAIRS) {
    if (only && only !== mode) continue;
    const a = parse(t[fg]);
    const b = parse(t[bg]);
    if (!a || !b) {
      console.log(`  ? ${fg} / ${bg}: token missing`);
      failures++;
      continue;
    }
    const ratio = wcagContrast(a, b);
    const ok = ratio >= min;
    if (!ok) failures++;
    console.log(`  ${ok ? '✓' : '✗'} ${fg.padEnd(28)} on ${bg.padEnd(20)} ${ratio.toFixed(2).padStart(5)} (min ${min})  ${formatHex(a)} / ${formatHex(b)}`);
  }
}
if (failures) {
  console.error(`\n${failures} contrast failure(s)`);
  process.exit(1);
}
console.log('\nAll token pairs meet WCAG AA.');
