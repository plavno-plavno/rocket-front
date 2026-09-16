/**
 * Second half of `pnpm gen --check` (runs under tsx so it can import TypeScript feature files):
 * validates the feature registry — unique ids / urls / shortcuts / kbar ids, feature id equals
 * folder name, nav groups exist, i18n keys exist in both locales (SDD-01T §3.1).
 */
import { features } from '@/generated/feature-registry';
import { messages } from '@/generated/messages';
import { NAV_GROUPS } from '@/config/nav-groups';
import { TRACKS } from '@/config/tracks';

const errors: string[] = [];
const seen = { id: new Map<string, string>(), url: new Map<string, string>(), shortcut: new Map<string, string>(), kbar: new Map<string, string>() };

function hasKey(locale: 'ru' | 'en', key: string): boolean {
  let node: unknown = messages[locale];
  for (const part of key.split('.')) {
    if (!node || typeof node !== 'object' || !(part in (node as object))) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string';
}

function checkKey(feature: string, key: string) {
  for (const locale of ['ru', 'en'] as const) if (!hasKey(locale, key)) errors.push(`${feature}: i18n key "${key}" missing in ${locale}`);
}

function unique(kind: keyof typeof seen, value: string, owner: string) {
  const prev = seen[kind].get(value);
  if (prev) errors.push(`${owner}: duplicate ${kind} "${value}" (also in ${prev})`);
  else seen[kind].set(value, owner);
}

for (const f of features) {
  unique('id', f.id, f.id);
  if (!(TRACKS as readonly string[]).includes(f.track)) errors.push(`${f.id}: unknown track "${f.track}"`);
  for (const item of f.nav ?? []) {
    if (!NAV_GROUPS.some((g) => g.id === item.group)) errors.push(`${f.id}: unknown nav group "${item.group}"`);
    // A parent pointing at its first child (collapsible section) is not a duplicate.
    if (!item.children?.some((c) => c.url === item.url)) unique('url', item.url, f.id);
    checkKey(f.id, item.titleKey);
    if (item.shortcut) unique('shortcut', item.shortcut.join(' '), f.id);
    for (const child of item.children ?? []) {
      unique('url', child.url, f.id);
      checkKey(f.id, child.titleKey);
    }
  }
  for (const action of f.kbar ?? []) {
    if (!action.id.startsWith(`${f.id}.`)) errors.push(`${f.id}: kbar action id "${action.id}" must be prefixed with "${f.id}."`);
    unique('kbar', action.id, f.id);
    checkKey(f.id, action.titleKey);
    if (action.section) checkKey(f.id, action.section);
    if (action.kind === 'navigate' && !action.url) errors.push(`${f.id}: kbar action "${action.id}" has kind navigate but no url`);
  }
}

if (errors.length) {
  for (const e of errors) console.error(`[gen:validate] ${e}`);
  console.error(`[gen:validate] ${errors.length} error(s)`);
  process.exit(1);
}
console.log(`[gen:validate] ${features.length} feature(s) valid`);
