import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import {
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  isLocale,
  LOCALE_COOKIE,
  TIMEZONE_COOKIE,
  type Locale
} from './config';
import { messages } from '@/generated/messages';

function negotiateFromHeader(acceptLanguage: string | null): Locale | undefined {
  if (!acceptLanguage) return undefined;
  for (const part of acceptLanguage.split(',')) {
    const tag = part.split(';')[0].trim().toLowerCase().slice(0, 2);
    if (isLocale(tag)) return tag;
  }
  return undefined;
}

export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(fromCookie)
    ? fromCookie
    : (negotiateFromHeader(headerStore.get('accept-language')) ?? DEFAULT_LOCALE);
  const timeZone = cookieStore.get(TIMEZONE_COOKIE)?.value || DEFAULT_TIMEZONE;

  return {
    locale,
    timeZone,
    messages: messages[locale],
    formats: {
      dateTime: {
        short: { day: 'numeric', month: 'short' },
        medium: { day: 'numeric', month: 'short', year: 'numeric' },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        },
        time: { hour: '2-digit', minute: '2-digit' }
      },
      number: {
        integer: { maximumFractionDigits: 0 },
        percent: { style: 'percent', maximumFractionDigits: 0 },
        rating: { minimumFractionDigits: 1, maximumFractionDigits: 1 }
      }
    },
    onError(error) {
      if (process.env.NODE_ENV !== 'production') console.error(error);
    },
    getMessageFallback({ namespace, key }) {
      return `${namespace ? `${namespace}.` : ''}${key}`;
    }
  };
});
