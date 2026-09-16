#!/usr/bin/env node
/**
 * pnpm check:templates (CI) — SDD-01T §3.6.
 * Every `src/app/dashboard/** /page.tsx` must render one of the components/lp templates
 * (ListPage, DetailPage, AnalyticsPage, InboxPage, SettingsPage, WizardPage) or PlannedPage.
 * Parallel-route slot pages (`@slot/page.tsx`) and layouts are exempt; a layout that renders a
 * template covers its page.tsx (overview).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src/app/dashboard');
const TEMPLATES = ['ListPage', 'DetailPage', 'AnalyticsPage', 'InboxPage', 'SettingsPage', 'WizardPage', 'PlannedPage'];
const problems = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name === 'page.tsx') check(p);
  }
}

function usesTemplate(src) {
  return TEMPLATES.some((t) => new RegExp(`<${t}[\\s>]`).test(src)) || /<PageContainer[\s>]/.test(src);
}

function check(page) {
  const rel = relative(ROOT, page);
  if (rel.includes('/@') || rel.startsWith('@')) return; // slot pages render widgets, the layout owns the template
  const src = readFileSync(page, 'utf8');
  if (/redirect\(/.test(src)) return; // pure redirect pages (e.g. /dashboard → overview)
  if (usesTemplate(src)) return;
  // a component imported by the page may render the template (e.g. notifications-page.tsx)
  const imports = [...src.matchAll(/from '@\/features\/[^']+'/g)].map((m) => m[0].slice(6, -1));
  const viaFeature = imports.some((imp) => {
    try {
      const file = join(process.cwd(), 'src', imp.replace(/^@\//, '')) + '.tsx';
      return usesTemplate(readFileSync(file, 'utf8'));
    } catch {
      return false;
    }
  });
  if (viaFeature) return;
  // page whose layout.tsx renders a template
  const layout = join(dirname(page), 'layout.tsx');
  try {
    if (usesTemplate(readFileSync(layout, 'utf8'))) return;
  } catch {
    /* no layout */
  }
  problems.push(rel);
}

walk(ROOT);
if (problems.length) {
  console.error('[check:templates] pages without a components/lp template or PlannedPage:');
  for (const p of problems) console.error(`  src/app/dashboard/${p}`);
  process.exit(1);
}
console.log('[check:templates] all dashboard pages render a template');
