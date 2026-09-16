import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { ROOT } from './lib.mjs';

const require = createRequire(import.meta.url);

/**
 * Static vendor assets served from /public/vendor (gitignored):
 * - maplibre-gl worker: MapLibre resolves its worker relative to its own bundle URL, which does
 *   not exist under the Next bundler → we serve the file ourselves and point WORKER_URL at it.
 */
const maplibreDist = () => join(dirname(require.resolve('maplibre-gl/package.json')), 'dist');
const ASSETS = [
  { from: () => join(maplibreDist(), 'maplibre-gl-worker.mjs'), to: 'public/vendor/maplibre-gl-worker.mjs' },
  // the worker imports this sibling chunk
  { from: () => join(maplibreDist(), 'maplibre-gl-shared.mjs'), to: 'public/vendor/maplibre-gl-shared.mjs' }
];

export function syncVendor(report) {
  const out = [];
  for (const a of ASSETS) {
    const src = a.from();
    const dst = join(ROOT, a.to);
    if (!existsSync(src)) {
      report.warn(`vendor: ${src} not found`);
      continue;
    }
    mkdirSync(dirname(dst), { recursive: true });
    const changed = !existsSync(dst) || statSync(dst).size !== statSync(src).size || readFileSync(dst, 'utf8') !== readFileSync(src, 'utf8');
    if (changed) copyFileSync(src, dst);
    report.outputs.push({ path: relative(ROOT, dst), changed });
    out.push(a.to);
  }
  return out;
}
