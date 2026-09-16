'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { PlatformIcon, SyncStatusBadge } from '@/components/lp';
import { LinkButton } from '@/components/ui/link-button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { listingsQueryOptions } from '../api/listings-queries';

/** Public: listings in `action_required` with their reason + CTA (F8 overview widget). */
export function ActionRequiredList({ scope, limit = 5 }: { scope: string; limit?: number }) {
  const t = useTranslations('locations.actionRequired');
  const { data, isPending } = useQuery(
    listingsQueryOptions({
      scope,
      page: 1,
      page_size: limit,
      'filter[sync_status]': ['action_required']
    })
  );
  if (isPending)
    return (
      <div className='flex flex-col gap-2'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className='h-10' />
        ))}
      </div>
    );
  const items = data?.items ?? [];
  if (!items.length)
    return (
      <Empty className='py-6'>
        <EmptyHeader>
          <EmptyTitle>{t('empty')}</EmptyTitle>
          <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  return (
    <ul className='flex flex-col divide-y'>
      {items.map((l) => (
        <li key={l.id} className='flex items-center gap-3 py-2 text-sm'>
          <PlatformIcon platformId={l.platform_id} className='size-5' />
          <div className='min-w-0 flex-1'>
            <p className='truncate font-medium'>{l.observed_name ?? l.external_id}</p>
            <p className='text-muted-foreground truncate text-xs'>
              {l.action_hint ?? l.action_reason}
            </p>
          </div>
          <SyncStatusBadge status={l.sync_status} compact />
          <LinkButton
            variant='outline'
            size='sm'
            href={`/dashboard/locations/${l.location_id}?tab=listings`}
          >
            {t('open')}
          </LinkButton>
        </li>
      ))}
    </ul>
  );
}
