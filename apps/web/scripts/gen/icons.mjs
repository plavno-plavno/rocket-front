import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { HEADER, SRC } from './lib.mjs';

/**
 * Merges src/components/icons/sets/*.ts (each exporting `icons`) into
 * src/components/icons/index.ts (generated, gitignored). Import path stays `@/components/icons`.
 */
export function generateIcons(report) {
  const dir = join(SRC, 'components/icons/sets');
  if (!existsSync(dir)) return [];
  const sets = readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => f.replace(/\.ts$/, ''))
    .sort();
  const seen = new Map();
  for (const set of sets) {
    const src = readFileSync(join(dir, `${set}.ts`), 'utf8');
    const body = /export const icons = \{([\s\S]*?)\} as const;/.exec(src)?.[1] ?? '';
    for (const m of body.matchAll(/^\s*([a-zA-Z0-9_]+):/gm)) {
      const key = m[1];
      if (seen.has(key)) report.error(`icons: key "${key}" defined in both ${seen.get(key)} and ${set}`);
      else seen.set(key, set);
    }
  }
  const ident = (s) => s.replace(/[^a-zA-Z0-9]/g, '_');
  let out = HEADER;
  for (const set of sets) out += `import { icons as ${ident(set)} } from './sets/${set}';\n`;
  out += '\n/** Single icon registry. Never import from @tabler/icons-react directly (AGENTS.md). */\nexport const Icons = {\n';
  for (const set of sets) out += `  ...${ident(set)},\n`;
  out += '} as const;\n\nexport type IconKey = keyof typeof Icons;\n';
  const target = join(SRC, 'components/icons/index.ts');
  const previous = existsSync(target) ? readFileSync(target, 'utf8') : null;
  if (previous !== out) writeFileSync(target, out);
  report.outputs.push({ path: relative(join(SRC, '..'), target), changed: previous !== out });
  return sets;
}
