#!/usr/bin/env node
/**
 * pnpm scaffold:routes
 *
 * Creates page.tsx (PlannedPage), loading.tsx and error.tsx for every route of
 * scripts/scaffold/features.json#routes that has no page.tsx yet (SDD-01T §3.3).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(resolve(HERE, 'features.json'), 'utf8'));
const created = [];

for (const [route, meta] of Object.entries(config.routes)) {
  if (route.startsWith('$')) continue;
  const dir = resolve('src/app', route.replace(/^\//, ''));
  const feature = config.features[meta.feature];
  const track = feature?.track ?? 'UI-DS';
  const files = {
    'page.tsx': `import { PlannedPage } from '@/components/lp/planned-page';

/** ${meta.screen} — owned by ${track}. Replace PlannedPage with the real screen (must render a components/lp template). */
export default function Page() {
  return <PlannedPage feature='${meta.feature}' screen='${meta.screen}' track='${track}' />;
}
`,
    'loading.tsx': `import PageContainer from '@/components/layout/page-container';

export default function Loading() {
  return (
    <PageContainer isLoading>
      <span />
    </PageContainer>
  );
}
`,
    'error.tsx': `'use client';

import { RouteError } from '@/components/layout/route-error';

export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} />;
}
`
  };
  for (const [name, content] of Object.entries(files)) {
    const file = resolve(dir, name);
    if (name === 'page.tsx' ? existsSync(file) : existsSync(file)) continue;
    // never overwrite an existing page; loading/error are added next to existing pages too
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, content);
    created.push(`${route}/${name}`);
  }
}
console.log(created.length ? `scaffold:routes: created\n  ${created.join('\n  ')}` : 'scaffold:routes: nothing to do');
