'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { LOCALES } from '@/lib/i18n';
import { setLocaleAction } from '@/lib/i18n/actions';

/** Language toggle (RU / EN) — sets the locale cookie and refreshes server components. */
export function LanguageSwitcher({ variant = 'icon' }: { variant?: 'icon' | 'menu-items' }) {
  const locale = useLocale();
  const t = useTranslations('locales');
  const tl = useTranslations('layout');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const change = (next: string) => {
    if (next === locale) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  };

  if (variant === 'menu-items') {
    return (
      <>
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => change(l)}
            aria-current={l === locale ? 'true' : undefined}
          >
            <span className='w-6 text-xs font-medium uppercase'>{l}</span>
            {t(l)}
            {l === locale && <Icons.check className='ml-auto size-4' />}
          </DropdownMenuItem>
        ))}
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant='ghost' size='sm' aria-label={tl('language')} disabled={pending} />}
      >
        <span className='text-xs font-medium uppercase'>{locale}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} onClick={() => change(l)}>
            <span className='w-6 text-xs font-medium uppercase'>{l}</span>
            {t(l)}
            {l === locale && <Icons.check className='ml-auto size-4' />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
