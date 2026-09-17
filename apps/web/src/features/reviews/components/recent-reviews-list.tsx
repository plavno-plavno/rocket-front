'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useState } from 'react';
import { PlatformIcon, RatingStars } from '@/components/lp';
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { reviewsQueryOptions } from '../api/queries';
import { ReviewDrawer } from './review-drawer';

/** Public stub (SDD-01T §3.5): latest reviews in scope (F8 overview «recent reviews»). Click opens the drawer. */
export function RecentReviewsList({ scope, limit = 5 }: { scope: string; limit?: number }) {
  const t = useTranslations('reviews.recent');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isPending } = useQuery(
    reviewsQueryOptions({ scope, limit, sort: '-published_at' })
  );

  if (isPending)
    return (
      <div className='flex flex-col gap-2'>
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className='h-12' />
        ))}
      </div>
    );
  const items = data?.items ?? [];
  if (!items.length)
    return (
      <Empty className='py-6'>
        <EmptyHeader>
          <EmptyTitle>{t('empty')}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  return (
    <>
      <ul className='flex flex-col divide-y'>
        {items.map((r) => (
          <li key={r.id}>
            <button
              type='button'
              onClick={() => setOpenId(r.id)}
              className='hover:bg-accent/50 flex w-full items-start gap-3 rounded-md px-1 py-3 text-left text-sm'
            >
              <PlatformIcon platformId={r.platform_id} className='mt-0.5 size-5' />
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='truncate font-medium'>{r.author.name}</span>
                  <RatingStars rating={r.rating} />
                  <span className='text-muted-foreground ml-auto shrink-0 text-xs'>
                    {format.relativeTime(new Date(r.published_at), now)}
                  </span>
                </div>
                <p className='text-muted-foreground truncate text-xs'>{r.location_name}</p>
                {r.text && <p className='line-clamp-2 text-xs'>{r.text}</p>}
              </div>
            </button>
          </li>
        ))}
      </ul>
      <ReviewDrawer reviewId={openId} open={!!openId} onOpenChange={(o) => !o && setOpenId(null)} />
    </>
  );
}
