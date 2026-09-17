'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Icons } from '@/components/icons';
import { KwicTable, PlatformIcon, RatingStars } from '@/components/lp';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewDrawer } from '@/features/reviews';
import { reviewConcordanceQueryOptions } from '../api/queries';
import { useAnalyticsParams } from '../hooks/use-analytics-params';

/** S-ANL-08 «Concordance»: keyword in context over the filtered reviews; a row opens the review. */
export function Concordance() {
  const t = useTranslations('review-analytics.concordance');
  const format = useFormatter();
  const { params, setParams, query } = useAnalyticsParams();
  const [draft, setDraft] = useState(params.keyword);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const keyword = params.keyword.trim();
  const { data, isPending } = useQuery({
    ...reviewConcordanceQueryOptions({ ...query, keyword, page: params.page, page_size: 50 }),
    enabled: keyword.length > 0
  });
  const rows = (data?.items ?? []).map((r) => ({
    id: r.review_id,
    left: r.left,
    keyword: r.keyword,
    right: r.right,
    meta: (
      <span className='flex items-center gap-3 text-xs whitespace-nowrap'>
        <RatingStars rating={r.rating} size='sm' />
        <PlatformIcon platformId={r.platform_id} />
        <span className='text-muted-foreground max-w-40 truncate'>{r.location_name}</span>
        <time dateTime={r.published_at} className='text-muted-foreground'>
          {format.dateTime(new Date(r.published_at), 'short')}
        </time>
      </span>
    )
  }));
  const submit = () => setParams({ keyword: draft.trim(), page: 1 });

  return (
    <div className='flex flex-col gap-4 lg:col-span-2' data-testid='concordance'>
      <form
        className='flex flex-wrap items-center gap-2'
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className='relative min-w-64 flex-1'>
          <Icons.search className='text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2' />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('placeholder')}
            className='h-9 pl-8'
            aria-label={t('keyword')}
            data-testid='concordance-input'
          />
        </div>
        <Button type='submit' size='sm' className='h-9'>
          {t('search')}
        </Button>
        {keyword && (
          <span className='text-muted-foreground text-xs'>
            {t('count', { count: data?.meta.total ?? 0 })}
          </span>
        )}
      </form>
      {!keyword ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Icons.search />
            </EmptyMedia>
            <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('emptyHint')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : isPending ? (
        <Skeleton className='h-64' />
      ) : rows.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Icons.search />
            </EmptyMedia>
            <EmptyTitle>{t('nothing', { keyword })}</EmptyTitle>
            <EmptyDescription>{t('nothingHint')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <KwicTable
          rows={rows}
          keyword={keyword}
          metaHeader={t('meta')}
          onRowClick={(row) => setReviewId(row.id)}
        />
      )}
      <ReviewDrawer
        reviewId={reviewId}
        open={!!reviewId}
        onOpenChange={(o) => !o && setReviewId(null)}
      />
    </div>
  );
}
