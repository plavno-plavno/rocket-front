'use server';

import { cookies } from 'next/headers';
import { isLocale, LOCALE_COOKIE, TIMEZONE_COOKIE } from './config';

const YEAR = 60 * 60 * 24 * 365;

export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: '/', maxAge: YEAR, sameSite: 'lax' });
}

export async function setTimeZoneAction(timeZone: string) {
  if (!/^[A-Za-z_]+\/[A-Za-z_/+-]+$/.test(timeZone)) return;
  (await cookies()).set(TIMEZONE_COOKIE, timeZone, { path: '/', maxAge: YEAR, sameSite: 'lax' });
}
