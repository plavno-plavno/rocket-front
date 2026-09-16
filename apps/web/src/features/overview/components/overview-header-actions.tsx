'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { useCan } from '@/features/session';
import { cn } from '@/lib/utils';

export function OverviewHeaderActions() {
  const t = useTranslations('overview.actions');
  const canEdit = useCan('locations.edit');
  if (!canEdit) return null;
  return (
    <div className='flex items-center gap-2'>
      <Link
        href='/dashboard/locations/import'
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
      >
        <Icons.upload className='size-4' /> {t('import')}
      </Link>
      <Link href='/dashboard/locations/new' className={cn(buttonVariants({ size: 'sm' }))}>
        <Icons.add className='size-4' /> {t('addLocation')}
      </Link>
    </div>
  );
}
