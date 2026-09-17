import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Script from 'next/script';
import type { Locale } from './config';

/**
 * Locales whose Intl data Chromium lacks (it silently formats `be` as English). For them the
 * FormatJS polyfills from /public/vendor/intl (built by `pnpm gen`) load `beforeInteractive`, so the
 * client formats numbers / dates / relative times exactly like the server did. Keep in sync with
 * `POLYFILL_LOCALES` in scripts/gen/intl-polyfill.mjs.
 */
export const POLYFILL_LOCALES: readonly Locale[] = ['be'];

const PACKAGES = ['intl-numberformat', 'intl-datetimeformat', 'intl-relativetimeformat'] as const;
const DATA_LOCALES = ['be', 'ru', 'en'] as const;

let versions: Record<string, string> | null = null;
/** Cache-busting query from the package versions written by the gen step (read once per process). */
function version(pkg: string): string {
  versions ??= Object.fromEntries(
    PACKAGES.map((p) => {
      try {
        return [
          p,
          readFileSync(join(process.cwd(), 'public/vendor/intl', p, 'VERSION'), 'utf8').trim()
        ];
      } catch {
        return [p, '0'];
      }
    })
  );
  return versions[pkg] ?? '0';
}

/**
 * Renders nothing for natively supported locales. Place inside `<body>` of the root layout.
 * The lint rule below targets the pages router; in the app router `beforeInteractive` belongs to the root layout.
 */
/* oxlint-disable next/no-before-interactive-script-outside-document */
export function IntlPolyfill({ locale }: { locale: Locale }) {
  if (!POLYFILL_LOCALES.includes(locale)) return null;
  return (
    <>
      {PACKAGES.flatMap((pkg) => {
        const v = version(pkg);
        const files = [
          'polyfill',
          ...(pkg === 'intl-datetimeformat' ? ['tz'] : []),
          ...DATA_LOCALES
        ];
        return files.map((f) => (
          <Script
            key={`${pkg}/${f}`}
            src={`/vendor/intl/${pkg}/${f}.js?v=${v}`}
            strategy='beforeInteractive'
          />
        ));
      })}
    </>
  );
}
