'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { isApiError } from '@/lib/api';

/** Shared body of route `error.tsx` files: localized message, request id for support, retry. */
export function RouteError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('layout');
  useEffect(() => {
    console.error(error);
  }, [error]);
  const detail = isApiError(error)
    ? `${error.status} ${error.code}${error.requestId ? ` · ${error.requestId}` : ''}`
    : (error.digest ?? undefined);
  return (
    <div className='flex flex-1 items-center justify-center p-6'>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <Icons.warning />
          </EmptyMedia>
          <EmptyTitle>{t('somethingWentWrong')}</EmptyTitle>
          <EmptyDescription>{error.message}</EmptyDescription>
          {detail && <p className='text-muted-foreground font-mono text-xs'>{detail}</p>}
        </EmptyHeader>
        <Button variant='outline' onClick={reset}>
          {t('tryAgain')}
        </Button>
      </Empty>
    </div>
  );
}
