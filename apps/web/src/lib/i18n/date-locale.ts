'use client';

import { be, enUS, ru } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import type { Locale as DateFnsLocale } from 'date-fns';

const LOCALES: Record<string, DateFnsLocale> = { ru, be, en: enUS };

/** date-fns locale matching the active next-intl locale (calendar, date-fns `format`). */
export function useDateFnsLocale(): DateFnsLocale {
  return LOCALES[useLocale()] ?? ru;
}
