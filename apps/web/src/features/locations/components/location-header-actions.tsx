'use client';

import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useQueryStates } from 'nuqs';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button, buttonVariants } from '@/components/ui/button';
import { useCan } from '@/features/session';
import { cn } from '@/lib/utils';
import { exportLocationsMutation } from '../api/mutations';
import { locationsSearchParams } from '../searchparams';

export function LocationHeaderActions() {
  const t = useTranslations('locations.list');
  const canEdit = useCan('locations.edit');
  const [params] = useQueryStates(locationsSearchParams, { shallow: true });
  const exportMutation = useMutation({
    ...exportLocationsMutation(params.scope),
    onSuccess: () => toast.success(t('exportQueued')),
    onError: (error) => toast.error(error.message)
  });

  return (
    <div className='flex items-center gap-2'>
      <Button
        variant='outline'
        size='sm'
        onClick={() => exportMutation.mutate({ format: 'xlsx', filters: params })}
        disabled={exportMutation.isPending}
      >
        <Icons.download className='size-4' />{' '}
        <span className='hidden md:inline'>{t('export')}</span>
      </Button>
      {canEdit && (
        <>
          <Link
            href='/dashboard/locations/import'
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            <Icons.upload className='size-4' />{' '}
            <span className='hidden md:inline'>{t('import')}</span>
          </Link>
          <Link href='/dashboard/locations/new' className={cn(buttonVariants({ size: 'sm' }))}>
            <Icons.add className='size-4' /> {t('add')}
          </Link>
        </>
      )}
    </div>
  );
}
