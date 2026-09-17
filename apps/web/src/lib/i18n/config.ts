export const LOCALES = ['ru', 'be', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ru';
export const DEFAULT_TIMEZONE = 'Europe/Moscow';

/** Cookie set by the language switcher (no locale prefix in URLs, SDD-01 §3.3). */
export const LOCALE_COOKIE = 'NEXT_LOCALE';
/** Cookie mirrored from `tenant.timezone` by the session provider so server rendering uses it. */
export const TIMEZONE_COOKIE = 'lp_tz';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
