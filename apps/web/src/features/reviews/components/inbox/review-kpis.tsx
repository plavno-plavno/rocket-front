'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useQueryStates } from 'nuqs';
import { StatusStatCard } from '@/components/lp';
import { reviewsSummaryQueryOptions } from '../../api/queries';
import { reviewsSearchParams, toReviewsQuery } from '../../searchparams';

/** 5 KPI cards without progress (SCR-3); Positive / Negative / No rating act as rating filters. */
export function ReviewKpis() {
  const t = useTranslations('reviews.kpi');
  const format = useFormatter();
  const [params, setParams] = useQueryStates(reviewsSearchParams, { shallow: true });
  const q = toReviewsQuery(params);
  const { data, isPending } = useQuery(
    reviewsSummaryQueryOptions({
      scope: q.scope,
      'filter[from]': q['filter[from]'],
      'filter[to]': q['filter[to]'],
      'filter[platform_id]': q['filter[platform_id]'],
      'filter[location_id]': q['filter[location_id]']
    })
  );
  const is = (r: readonly string[]) =>
    params.rating.length === r.length && r.every((x) => params.rating.includes(x as never));
  const toggle = (r: readonly ('1' | '2' | '3' | '4' | '5' | 'none')[]) =>
    void setParams({ rating: is(r) ? [] : [...r] });

  return (
    <>
      <StatusStatCard
        title={t('total')}
        value={data?.total}
        icon='chat'
        loading={isPending}
        active={params.rating.length === 0}
        onClick={() => void setParams({ rating: [] })}
      />
      <StatusStatCard
        title={t('positive')}
        value={data?.positive}
        icon='trendingUp'
        tone='text-rating-positive'
        loading={isPending}
        active={is(['4', '5'])}
        onClick={() => toggle(['4', '5'])}
      />
      <StatusStatCard
        title={t('negative')}
        value={data?.negative}
        icon='trendingDown'
        tone='text-rating-negative'
        loading={isPending}
        active={is(['1', '2'])}
        onClick={() => toggle(['1', '2'])}
      />
      <StatusStatCard
        title={t('withoutRating')}
        value={data?.without_rating}
        icon='circleDashed'
        tone='text-rating-none'
        loading={isPending}
        active={is(['none'])}
        onClick={() => toggle(['none'])}
      />
      <StatusStatCard
        title={t('averageRating')}
        value={
          data?.average_rating == null
            ? '—'
            : format.number(data.average_rating, { maximumFractionDigits: 2 })
        }
        icon='star'
        tone='text-rating-star'
        loading={isPending}
        hint={data ? t('unanswered') + ': ' + data.unanswered : undefined}
      />
    </>
  );
}
