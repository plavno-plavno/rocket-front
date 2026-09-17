'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { PlatformIcon } from '@/components/lp';
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
  // Same row rhythm as RecentReviewsList (they sit side by side on the overview). The status badge is
  // omitted: every row here is «Требуется действие», the card title already says so. The button moves
  // under the text only when the card itself is narrow (container query, not viewport).
  return (
    <ul className='@container flex flex-col divide-y'>
      {items.map((l) => (
        <li
          key={l.id}
          className='grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 px-1 py-3 text-sm @md:grid-cols-[auto_minmax(0,1fr)_auto] @md:items-center'
        >
          <PlatformIcon platformId={l.platform_id} className='mt-0.5 size-5 @md:mt-0' />
          <div className='min-w-0'>
            <p className='truncate font-medium'>{l.observed_name ?? l.external_id}</p>
            <p className='text-muted-foreground line-clamp-2 text-xs'>
              {l.action_hint ?? l.action_reason}
            </p>
          </div>
          <LinkButton
            variant='outline'
            size='sm'
            className='col-start-2 justify-self-start @md:col-start-3'
            href={`/dashboard/locations/${l.location_id}?tab=listings`}
          >
            {t('open')}
          </LinkButton>
        </li>
      ))}
    </ul>
  );
}
