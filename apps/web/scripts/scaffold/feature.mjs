#!/usr/bin/env node
/**
 * pnpm scaffold:feature <id> [--all]
 *
 * Creates the SDD-01T §3.4 skeleton of a feature from scripts/scaffold/features.json:
 *   feature.ts, index.ts, messages/{ru,en}.json, mocks/{handlers,fixtures,scenarios}.ts,
 *   searchparams.ts, components/, e2e/ and api/* via scaffold:api. Existing files are kept.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(resolve(HERE, 'features.json'), 'utf8'));
const args = process.argv.slice(2);
const ids = args.includes('--all') ? Object.keys(config.features) : args.filter((a) => !a.startsWith('--'));
if (!ids.length) {
  console.error('usage: scaffold:feature <id> | --all');
  process.exit(1);
}

const write = (file, content) => {
  if (existsSync(file)) return false;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  return true;
};

const humanize = (id) => id.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

for (const id of ids) {
  const f = config.features[id];
  if (!f) {
    console.error(`scaffold:feature: unknown feature "${id}" (add it to features.json)`);
    process.exit(1);
  }
  const dir = resolve('src/features', id);
  const created = [];

  // feature.ts
  const def = { id, track: f.track, status: 'planned', ...(f.screens ? { screens: f.screens } : {}), ...(f.nav ? { nav: f.nav } : {}), ...(f.kbar ? { kbar: f.kbar } : {}), ...(f.routes ? { routes: f.routes } : {}) };
  const featureTs = `import { defineFeature } from '@/shell/feature';\n\nexport default defineFeature(${JSON.stringify(def, null, 2).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/"/g, "'")});\n`;
  if (write(resolve(dir, 'feature.ts'), featureTs)) created.push('feature.ts');

  // index.ts
  if (write(resolve(dir, 'index.ts'), `/**\n * Public API of the ${id} feature (SDD-01T §3.5). Other features import only from here.\n * Keep exports additive; breaking changes need a cross-track PR.\n */\nexport const FEATURE_PUBLIC_API_VERSION = 1;\n`)) created.push('index.ts');

  // messages: nav keys from the definition so gen --check passes immediately
  const navKeys = {};
  for (const item of f.nav ?? []) {
    const [, ...rest] = item.titleKey.split('.');
    setDeep(navKeys, rest, humanize(rest[rest.length - 1]));
    for (const c of item.children ?? []) {
      const [, ...r] = c.titleKey.split('.');
      setDeep(navKeys, r, humanize(r[r.length - 1]));
    }
  }
  for (const a of f.kbar ?? []) {
    const [, ...rest] = a.titleKey.split('.');
    setDeep(navKeys, rest, humanize(rest[rest.length - 1]));
  }
  const messages = { ...navKeys, page: { title: humanize(id), description: '' } };
  for (const locale of ['ru', 'en']) if (write(resolve(dir, 'messages', `${locale}.json`), JSON.stringify(messages, null, 2) + '\n')) created.push(`messages/${locale}.json`);

  // mocks
  if (write(resolve(dir, 'mocks', 'handlers.ts'), `import { http } from '@mocks/lib/http';\n\n/**\n * MSW handlers of the ${id} feature (SDD-01 §5.3). Registered automatically by \`pnpm gen\`.\n * Endpoints without a handler answer 501 from the mock server, so missing mocks are visible.\n * Provisional handlers (no contract yet) must be listed in mocks/scenarios.ts as \`provisional\`.\n */\nexport const handlers = [] as ReturnType<typeof http.get>[];\n`)) created.push('mocks/handlers.ts');
  if (write(resolve(dir, 'mocks', 'fixtures.ts'), `/** Feature-specific fixtures. Shared seed data lives in mocks/db (Foundation). */\nexport const fixtures = {};\n`)) created.push('mocks/fixtures.ts');
  if (write(resolve(dir, 'mocks', 'scenarios.ts'), `/**\n * Scenario hooks of the feature (x-mock-scenario). Keys must be one of mocks/db SCENARIOS.\n * \`provisional\` lists endpoints mocked ahead of the contract (SDD-01T §5.5) — the feature\n * cannot become \`ready\` while it is non-empty.\n */\nexport const provisional: string[] = [];\n`)) created.push('mocks/scenarios.ts');

  // searchparams
  if (write(resolve(dir, 'searchparams.ts'), `import { createSearchParamsCache } from 'nuqs/server';\nimport { commonSearchParams } from '@/lib/searchparams';\n\n/** URL state of the ${id} screens — spreads the shared parsers (scope, page, sort, q). */\nexport const ${camel(id)}SearchParams = { ...commonSearchParams };\n\nexport const ${camel(id)}SearchParamsCache = createSearchParamsCache(${camel(id)}SearchParams);\n`)) created.push('searchparams.ts');

  for (const sub of ['components', 'e2e']) if (write(resolve(dir, sub, '.gitkeep'), '')) created.push(`${sub}/`);

  // api via scaffold:api (skipped when the feature has no tags)
  if (f.tags?.length && !existsSync(resolve(dir, 'api', 'service.ts'))) {
    const extra = f.paths?.length ? ['--paths', f.paths.join(',')] : [];
    execFileSync('node', [resolve(HERE, 'api.mjs'), id, '--tags', f.tags.join(','), ...extra], { stdio: 'inherit' });
    created.push('api/*');
  }

  console.log(`scaffold:feature ${id}: ${created.length ? created.join(', ') : 'nothing to do'}`);
}

function setDeep(obj, path, value) {
  let node = obj;
  for (const key of path.slice(0, -1)) node = node[key] ??= {};
  node[path[path.length - 1]] ??= value;
}

function camel(id) {
  return id.replace(/[_-]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase());
}
