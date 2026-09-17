'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useState } from 'react';
import { PlatformIcon, RatingStars } from '@/components/lp';
import { Badge } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/link-button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewDrawer, reviewsQueryOptions } from '@/features/reviews';

/** S-LOC-03 «Отзывы»: reviews of this location (F2 public API); full inbox lives in /dashboard/reviews. */
export function ReviewsTab({ locationId }: { locationId: string }) {
  const t = useTranslations('locations.detail.reviews');
  const tw = useTranslations('reviews.workflow');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isPending } = useQuery(
    reviewsQueryOptions({
      scope: 'all',
      limit: 50,
      'filter[location_id]': [locationId],
      sort: '-published_at'
    })
  );

  if (isPending)
    return (
      <div className='flex flex-col gap-2'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-16' />
        ))}
      </div>
    );
  const items = data?.items ?? [];
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-medium'>{t('title')}</h3>
        <LinkButton
          variant='outline'
          size='sm'
          href={`/dashboard/reviews?location_id=${locationId}`}
        >
          {t('all')}
        </LinkButton>
      </div>
      {items.length === 0 ? (
        <p className='text-muted-foreground py-8 text-center text-sm'>{t('empty')}</p>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {items.map((r) => (
            <li key={r.id}>
              <button
                type='button'
                onClick={() => setOpenId(r.id)}
                className='hover:bg-accent/50 flex w-full items-start gap-3 p-3 text-left text-sm'
              >
                <PlatformIcon platformId={r.platform_id} className='mt-0.5 size-5' />
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='font-medium'>{r.author.name}</span>
                    <RatingStars rating={r.rating} />
                    <Badge variant='outline' className='text-[11px]'>
                      {tw(r.workflow_status)}
                    </Badge>
                    <span className='text-muted-foreground ml-auto text-xs'>
                      {format.relativeTime(new Date(r.published_at), now)}
                    </span>
                  </div>
                  {r.text && <p className='mt-1 line-clamp-2 text-xs'>{r.text}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <ReviewDrawer reviewId={openId} open={!!openId} onOpenChange={(o) => !o && setOpenId(null)} />
    </div>
  );
}
