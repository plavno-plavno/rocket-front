'use client';

import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const HELP_URL = process.env.NEXT_PUBLIC_HELP_URL ?? '/dashboard/help';

/**
 * Header help entry (SDD-01 §7.1): opens the knowledge base. Contextual help of a page lives in
 * its `PageContainer infoContent` (right infobar).
 */
export function HelpButton() {
  const t = useTranslations('layout');
  const external = HELP_URL.startsWith('http');
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={HELP_URL}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8')}
          >
            <Icons.help className='size-4' />
            <span className='sr-only'>{t('help')}</span>
          </a>
        }
      />
      <TooltipContent>{t('help')}</TooltipContent>
    </Tooltip>
  );
}
