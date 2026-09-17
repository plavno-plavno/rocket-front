import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import {
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  isLocale,
  LOCALE_COOKIE,
  TIMEZONE_COOKIE,
  type Locale
} from './config';
import { messages } from '@/generated/messages';

export default getRequestConfig(async () => {
  // Russian is the product language; Belarusian / English only when the user picked it (cookie) — no browser negotiation.
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(fromCookie) ? fromCookie : DEFAULT_LOCALE;
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
