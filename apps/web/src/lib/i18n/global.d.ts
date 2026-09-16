import type { messages } from '@/generated/messages';

declare module 'next-intl' {
  interface AppConfig {
    Locale: keyof typeof messages;
    Messages: (typeof messages)['ru'];
  }
}
