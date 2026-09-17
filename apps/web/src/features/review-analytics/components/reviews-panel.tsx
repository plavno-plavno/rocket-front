'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Icons } from '@/components/icons';
import { DistributionCard, RatingStars, RegionChoropleth, StatusStatCard } from '@/components/lp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  reviewAnalyticsSummaryQueryOptions,
  reviewLocationsRankingQueryOptions,
  reviewRegionsQueryOptions,
  reviewTrendQueryOptions
} from '../api/queries';
import { useAnalyticsParams } from '../hooks/use-analytics-params';
import { deltaOf, formatDuration } from '../lib/export';
import { ReviewsTrendCard } from './reviews-trend-card';

const COUNTRIES = ['RU'] as const;

/** KPI row of S-ANL-01: six `StatusStatCard`s with deltas when a comparison period is set. */
export function ReviewsKpis() {
  const t = useTranslations('review-analytics.kpi');
  const td = useTranslations('review-analytics.duration');
  const format = useFormatter();
  const { query, compareQuery } = useAnalyticsParams();
  const { data, isPending } = useQuery(
    reviewAnalyticsSummaryQueryOptions({ ...query, ...compareQuery })
  );
  const pct = (v: number) => format.number(v, { maximumFractionDigits: 1 });
  const total = data?.total.value ?? 0;
  const answered =
    data?.answered_share.value == null ? null : Math.round(data.answered_share.value * total);

  return (
    <>
      <StatusStatCard
        title={t('total')}
        value={data?.total.value == null ? null : format.number(data.total.value)}
        icon='reviews'
        loading={isPending}
        {...deltaOf(data?.total, pct)}
      />
      <StatusStatCard
        title={t('complaints')}
        value={data?.complaints.value ?? null}
        icon='warning'
        tone='text-status-action'
        loading={isPending}
        {...deltaOf(data?.complaints, pct, true)}
      />
      <StatusStatCard
        title={t('edited')}
        value={data?.edited_by_users.value ?? null}
        icon='edit'
        loading={isPending}
        {...deltaOf(data?.edited_by_users, pct, true)}
      />
      <StatusStatCard
        title={t('answered')}
        value={answered}
        total={total}
        ofLabel={t('of')}
        icon='checks'
        tone='text-status-synced'
        loading={isPending}
        hint={
          data?.answered_share.value == null
            ? undefined
            : `${pct(data.answered_share.value * 100)} %`
        }
        {...deltaOf(data?.answered_share, pct)}
      />
      <StatusStatCard
        title={t('responseTime')}
        value={formatDuration(data?.avg_response_time_s.value, td)}
        icon='clock'
        loading={isPending}
        {...deltaOf(data?.avg_response_time_s, pct, true)}
      />
      <StatusStatCard
        title={t('deleted')}
        value={data?.deleted_by_users.value ?? null}
        icon='trash'
        tone='text-status-error'
        loading={isPending}
        {...deltaOf(data?.deleted_by_users, pct, true)}
      />
    </>
  );
}

/** Choropleth of reviews by region; clicking a region applies `filter[region]`. */
function RegionsCard() {
  const t = useTranslations('review-analytics.regions');
  const tc = useTranslations('review-analytics.countries');
  const format = useFormatter();
  const { query, filters, setFilters } = useAnalyticsParams();
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]>('RU');
  // The map shows the whole country; the region filter applies to the rest of the panel.
  const { 'filter[region]': _region, ...mapQuery } = query;
  void _region;
  const { data, isPending } = useQuery(reviewRegionsQueryOptions({ ...mapQuery, country }));
  const rows = useMemo(() => (data?.items ?? []).toSorted((a, b) => b.total - a.total), [data]);
  const total = rows.reduce((s, r) => s + r.total, 0);
  const selectedCode = rows.find((r) => r.region_name === filters.region)?.region_code ?? null;

  return (
    <Card className='lg:col-span-2' data-testid='regions-card'>
      <CardHeader className='flex flex-row items-start justify-between gap-4'>
        <div className='flex flex-col gap-1.5'>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('total', { country: tc(country), count: total })}</CardDescription>
        </div>
        <Select value={country} onValueChange={(v) => setCountry((v as typeof country) ?? 'RU')}>
          <SelectTrigger className='h-8 w-40' aria-label={t('country')}>
            <SelectValue>{(v: string) => tc(v as typeof country)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>
                {tc(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className='grid gap-4 lg:grid-cols-[1fr_16rem]'>
        {isPending ? (
          <Skeleton className='h-80' />
        ) : (
          <RegionChoropleth
            data={rows.map((r) => ({ code: r.region_code, name: r.region_name, value: r.total }))}
            selected={selectedCode}
            onSelect={(code) =>
              setFilters({
                region: code ? (rows.find((r) => r.region_code === code)?.region_name ?? '') : ''
              })
            }
            format={(v) => t('reviews', { count: v })}
            height={320}
          />
        )}
        <ol className='flex flex-col divide-y text-sm' data-testid='regions-list'>
          {rows.slice(0, 8).map((r) => (
            <li key={r.region_code}>
              <button
                type='button'
                className={cn(
                  'hover:bg-accent/50 flex w-full items-center gap-2 px-2 py-1.5 text-left',
                  filters.region === r.region_name && 'bg-accent'
                )}
                onClick={() =>
                  setFilters({ region: filters.region === r.region_name ? '' : r.region_name })
                }
              >
                <span className='min-w-0 flex-1 truncate'>{r.region_name}</span>
                <span className='text-muted-foreground tabular-nums'>{format.number(r.total)}</span>
                {r.average_rating != null && (
                  <span className='w-8 text-right text-xs tabular-nums'>
                    {format.number(r.average_rating, { maximumFractionDigits: 1 })}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

/** Average rating over time (area) — SDD-01 §8 [H-UI-07]. */
function RatingTrendCard() {
  const t = useTranslations('review-analytics.rating');
  const format = useFormatter();
  const { query, period } = useAnalyticsParams();
  const { data, isPending } = useQuery(
    reviewTrendQueryOptions({ ...query, granularity: period.granularity })
  );
  const config = {
    average_rating: { label: t('average'), color: 'var(--chart-1)' }
  } satisfies ChartConfig;
  return (
    <Card data-testid='rating-trend'>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className='h-56 w-full' />
        ) : (
          <ChartContainer config={config} className='h-56 w-full'>
            <AreaChart data={data?.items ?? []} margin={{ left: 4, right: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                minTickGap={32}
                tickFormatter={(v: string) => format.dateTime(new Date(v), 'short')}
              />
              <YAxis domain={[1, 5]} width={24} tickLine={false} axisLine={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(v) => format.dateTime(new Date(String(v)), 'medium')}
                  />
                }
              />
              <Area
                dataKey='average_rating'
                type='monotone'
                connectNulls
                fill='var(--color-average_rating)'
                fillOpacity={0.2}
                stroke='var(--color-average_rating)'
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function RatingDistribution() {
  const t = useTranslations('review-analytics.rating');
  const { query, compareQuery } = useAnalyticsParams();
  const { data } = useQuery(reviewAnalyticsSummaryQueryOptions({ ...query, ...compareQuery }));
  const dist = data?.rating_distribution;
  const segments = (['5', '4', '3', '2', '1'] as const).map((k) => ({
    key: k,
    label: t('stars', { count: Number(k) }),
    value: dist?.[k] ?? 0,
    colorClass:
      k === '5' || k === '4'
        ? 'bg-rating-positive'
        : k === '3'
          ? 'bg-rating-star'
          : 'bg-rating-negative'
  }));
  segments.push({
    key: 'none' as never,
    label: t('noRating'),
    value: dist?.none ?? 0,
    colorClass: 'bg-rating-none'
  });
  return <DistributionCard title={t('distribution')} segments={segments} />;
}

/** «Локации с наибольшим негативом» — top 5 by negative reviews, linking to the location card. */
function NegativeLocations() {
  const t = useTranslations('review-analytics.negative');
  const format = useFormatter();
  const { query } = useAnalyticsParams();
  const { data, isPending } = useQuery(
    reviewLocationsRankingQueryOptions({ ...query, sort: '-negative', page: 1, page_size: 5 })
  );
  const rows = (data?.items ?? []).filter((r) => (r.negative ?? 0) > 0);
  return (
    <Card data-testid='negative-locations'>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className='h-40' />
        ) : rows.length === 0 ? (
          <p className='text-muted-foreground text-sm'>{t('empty')}</p>
        ) : (
          <ol className='flex flex-col divide-y'>
            {rows.map((r, i) => (
              <li
                key={r.key}
                className='grid grid-cols-[1rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 py-3 text-sm'
              >
                <span className='text-muted-foreground w-4 text-right tabular-nums'>{i + 1}</span>
                <Link
                  href={`/dashboard/locations/${r.key}`}
                  className='min-w-0 break-words underline-offset-4 hover:underline'
                >
                  {r.label}
                </Link>
                <div className='col-start-2 flex flex-wrap items-center gap-3'>
                  {r.average_rating != null && (
                    <RatingStars rating={r.average_rating} size='sm' showValue />
                  )}
                  <span className='text-rating-negative inline-flex items-center gap-1 tabular-nums'>
                    <Icons.trendingDown className='size-3.5' />
                    {format.number(r.negative ?? 0)}
                  </span>
                  <span className='text-muted-foreground w-12 text-right text-xs tabular-nums'>
                    {t('ofTotal', { total: r.total })}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

/** S-ANL-01 body: choropleth, reviews trend, rating trend, distribution, worst locations. */
export function ReviewsPanel() {
  const { query, period } = useAnalyticsParams();
  return (
    <>
      <RegionsCard />
      <ReviewsTrendCard
        scope={query.scope}
        from={query.from}
        to={query.to}
        granularity={period.granularity}
        filters={query}
      />
      <RatingTrendCard />
      <RatingDistribution />
      <NegativeLocations />
    </>
  );
}
