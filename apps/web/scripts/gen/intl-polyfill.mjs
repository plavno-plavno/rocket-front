import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ROOT } from './lib.mjs';

/**
 * Intl polyfills for locales the browser's ICU may lack (Chromium ships no `be` data for
 * NumberFormat / DateTimeFormat / RelativeTimeFormat — it silently falls back to `en`).
 * Served from /public/vendor/intl and loaded `beforeInteractive` only for those locales
 * (src/lib/i18n/polyfill.tsx), so RU / EN users download nothing.
 */
export const POLYFILL_LOCALES = ['be'];
const DATA_LOCALES = ['be', 'ru', 'en'];
const PACKAGES = ['intl-numberformat', 'intl-datetimeformat', 'intl-relativetimeformat'];
/** IANA zones the polyfilled DateTimeFormat must know: tenant zones (profile settings) + Minsk (UTC is built in). */
const TIME_ZONES = [
  'Europe/Minsk',
  'Europe/Kaliningrad',
  'Europe/Moscow',
  'Europe/Samara',
  'Asia/Yekaterinburg',
  'Asia/Omsk',
  'Asia/Krasnoyarsk',
  'Asia/Irkutsk',
  'Asia/Yakutsk',
  'Asia/Vladivostok',
  'Asia/Magadan',
  'Asia/Kamchatka'
];

const OUT = join(ROOT, 'public/vendor/intl');

function write(name, content) {
  mkdirSync(dirname(join(OUT, name)), { recursive: true });
  const file = join(OUT, name);
  if (existsSync(file) && readFileSync(file, 'utf8') === content) return false;
  writeFileSync(file, content);
  return true;
}

export function syncIntlPolyfill(report) {
  const changed = [];
  for (const pkg of PACKAGES) {
    const dir = join(ROOT, 'node_modules', '@formatjs', pkg);
    const version = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version;
    // The shipped IIFE only installs when the *default* locale (en) is unsupported; we need it
    // whenever the target locale is — patch the single guard and fail loudly if the shape changes.
    const src = readFileSync(join(dir, 'polyfill.iife.js'), 'utf8');
    const guard = 'if (shouldPolyfill()) {';
    // Pinned to the last rollup-built majors: 9.x / 7.x IIFEs contain a stray ESM import (upstream bug).
    if (src.split(guard).length !== 2) {
      report.error(`intl-polyfill: unexpected guard in @formatjs/${pkg}@${version}/polyfill.iife.js`);
      continue;
    }
    const patched = src.replace(guard, `if (${JSON.stringify(POLYFILL_LOCALES)}.some((l) => shouldPolyfill(l))) {`).replace(/\/\/# sourceMappingURL=.*$/m, '');
    if (write(`${pkg}/polyfill.js`, patched)) changed.push(`${pkg}/polyfill.js`);
    for (const locale of DATA_LOCALES) {
      const data = readFileSync(join(dir, 'locale-data', `${locale}.js`), 'utf8');
      if (write(`${pkg}/${locale}.js`, data)) changed.push(`${pkg}/${locale}.js`);
    }
    if (pkg === 'intl-datetimeformat') {
      const all = readFileSync(join(dir, 'add-all-tz.js'), 'utf8');
      const start = all.indexOf('__addTZData(') + '__addTZData('.length;
      const tz = JSON.parse(all.slice(start, all.lastIndexOf('})') + 1));
      const zones = tz.zones.filter((z) => TIME_ZONES.includes(z.split('|')[0]));
      const missing = TIME_ZONES.filter((n) => !zones.some((z) => z.startsWith(`${n}|`)));
      if (missing.length) report.warn(`intl-polyfill: tz not found: ${missing.join(', ')}`);
      const subset = `// @generated subset of @formatjs/intl-datetimeformat@${version} add-all-tz.js (${zones.length} zones)\nif ('DateTimeFormat' in Intl && Intl.DateTimeFormat.__addTZData) {\n  Intl.DateTimeFormat.__addTZData(${JSON.stringify({ abbrvs: tz.abbrvs, offsets: tz.offsets, zones })});\n}\n`;
      if (write('intl-datetimeformat/tz.js', subset)) changed.push('intl-datetimeformat/tz.js');
    }
    write(`${pkg}/VERSION`, version);
  }
  return changed;
}
