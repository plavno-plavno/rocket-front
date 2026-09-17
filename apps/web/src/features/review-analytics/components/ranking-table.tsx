'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { RatingStars } from '@/components/lp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  reviewCitiesRankingQueryOptions,
  reviewLocationsRankingQueryOptions,
  reviewPhrasesRankingQueryOptions,
  reviewTagsRankingQueryOptions,
  reviewTopicsRankingQueryOptions
} from '../api/queries';
import type { RankingRow } from '../api/types';
import { useAnalyticsParams } from '../hooks/use-analytics-params';

export type RankingDimension = 'locations' | 'cities' | 'tags' | 'phrases' | 'topics';

const QUERY = {
  locations: reviewLocationsRankingQueryOptions,
  cities: reviewCitiesRankingQueryOptions,
  tags: reviewTagsRankingQueryOptions,
  phrases: reviewPhrasesRankingQueryOptions,
  topics: reviewTopicsRankingQueryOptions
} as const;

const SORTABLE = ['total', 'positive', 'negative', 'average_rating', 'answered_share'] as const;
type SortKey = (typeof SORTABLE)[number];

const SENTIMENT_TONE: Record<NonNullable<RankingRow['sentiment']>, string> = {
  positive: 'text-rating-positive',
  neutral: 'text-muted-foreground',
  negative: 'text-rating-negative'
};

/** Link target of a row: locations → card, phrases / topics → concordance with the keyword. */
function rowHref(dimension: RankingDimension, row: RankingRow): string | null {
  if (dimension === 'locations') return `/dashboard/locations/${row.key}`;
  if (dimension === 'phrases' || dimension === 'topics')
    return `/dashboard/analytics/reviews/concordance?keyword=${encodeURIComponent(row.label)}`;
  return null;
}

/**
 * S-ANL-02…05, 07: one table for every ranking dimension — search, sortable metric columns,
 * page-size pagination, sentiment badge; rows link to the location card or to the concordance.
 */
export function RankingTable({ dimension }: { dimension: RankingDimension }) {
  const t = useTranslations('review-analytics.ranking');
  const format = useFormatter();
  const { params, setParams, query } = useAnalyticsParams();
  const sort = params.sort || '-total';
  // Every dimension shares the RankingRow page shape; the cast collapses the per-key literal types.
  const options = QUERY[dimension] as typeof reviewLocationsRankingQueryOptions;
  const { data, isPending, isPlaceholderData } = useQuery({
    ...options({
      ...query,
      page: params.page,
      page_size: params.page_size,
      sort,
      ...(params.q ? { q: params.q } : {})
    }),
    placeholderData: (prev) => prev
  });
  const rows = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / params.page_size));
  const max = Math.max(1, ...rows.map((r) => r.total));

  const toggleSort = (key: SortKey) =>
    setParams({ sort: sort === `-${key}` ? key : `-${key}`, page: 1 });
  const sortIcon = (key: SortKey) =>
    sort === `-${key}` ? (
      <Icons.chevronDown className='size-3.5' />
    ) : sort === key ? (
      <Icons.chevronUp className='size-3.5' />
    ) : (
      <Icons.chevronsUpDown className='size-3.5 opacity-40' />
    );
  const head = (key: SortKey, label: string) => (
    <TableHead
      className='text-right'
      aria-sort={sort === `-${key}` ? 'descending' : sort === key ? 'ascending' : 'none'}
    >
      <button
        type='button'
        className='inline-flex items-center gap-1 hover:underline'
        onClick={() => toggleSort(key)}
      >
        {label} {sortIcon(key)}
      </button>
    </TableHead>
  );

  return (
    <div className='flex flex-col gap-3 lg:col-span-2' data-testid={`ranking-${dimension}`}>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative min-w-56 flex-1'>
          <Icons.search className='text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2' />
          <Input
            value={params.q}
            onChange={(e) => setParams({ q: e.target.value, page: 1 })}
            placeholder={t(`search.${dimension}`)}
            className='h-8 pl-8'
            aria-label={t(`search.${dimension}`)}
          />
        </div>
        <span className='text-muted-foreground text-xs'>{t('count', { count: total })}</span>
      </div>
      <div className={cn('overflow-x-auto rounded-lg border', isPlaceholderData && 'opacity-60')}>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead className='w-8'>#</TableHead>
              <TableHead>{t(`label.${dimension}`)}</TableHead>
              {head('total', t('total'))}
              {head('positive', t('positive'))}
              {head('negative', t('negative'))}
              {head('average_rating', t('rating'))}
              {head('answered_share', t('answered'))}
              <TableHead>{t('sentiment')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton className='h-5 w-full' />
                  </TableCell>
                </TableRow>
              ))}
            {!isPending && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className='text-muted-foreground py-10 text-center text-sm'>
                  {params.q ? t('emptyFiltered') : t('empty')}
                </TableCell>
              </TableRow>
            )}
            {rows.map((r, i) => {
              const href = rowHref(dimension, r);
              return (
                <TableRow key={r.key} data-key={r.key}>
                  <TableCell className='text-muted-foreground tabular-nums'>
                    {(params.page - 1) * params.page_size + i + 1}
                  </TableCell>
                  <TableCell>
                    <div className='flex min-w-48 flex-col gap-1'>
                      {href ? (
                        <Link
                          href={href}
                          className='font-medium underline-offset-4 hover:underline'
                        >
                          {r.label}
                        </Link>
                      ) : (
                        <span className='font-medium'>{r.label}</span>
                      )}
                      <Progress value={(r.total / max) * 100} className='h-1' />
                    </div>
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {format.number(r.total)}
                  </TableCell>
                  <TableCell className='text-rating-positive text-right tabular-nums'>
                    {r.positive == null ? '—' : format.number(r.positive)}
                  </TableCell>
                  <TableCell className='text-rating-negative text-right tabular-nums'>
                    {r.negative == null ? '—' : format.number(r.negative)}
                  </TableCell>
                  <TableCell className='text-right'>
                    {r.average_rating == null ? (
                      <span className='text-muted-foreground'>—</span>
                    ) : (
                      <span className='inline-flex justify-end'>
                        <RatingStars rating={r.average_rating} size='sm' showValue />
                      </span>
                    )}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {r.answered_share == null
                      ? '—'
                      : `${format.number(r.answered_share * 100, { maximumFractionDigits: 0 })} %`}
                  </TableCell>
                  <TableCell>
                    {r.sentiment && (
                      <Badge variant='outline' className={cn('gap-1', SENTIMENT_TONE[r.sentiment])}>
                        <span className='size-1.5 rounded-full bg-current' aria-hidden />
                        {t(`sentiments.${r.sentiment}`)}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {pages > 1 && (
        <div className='flex items-center justify-end gap-2 text-sm'>
          <span className='text-muted-foreground'>{t('page', { page: params.page, pages })}</span>
          <Button
            variant='outline'
            size='icon-sm'
            disabled={params.page <= 1}
            onClick={() => setParams({ page: params.page - 1 })}
            aria-label={t('prev')}
          >
            <Icons.chevronLeft className='size-4' />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            disabled={params.page >= pages}
            onClick={() => setParams({ page: params.page + 1 })}
            aria-label={t('next')}
          >
            <Icons.chevronRight className='size-4' />
          </Button>
        </div>
      )}
    </div>
  );
}
