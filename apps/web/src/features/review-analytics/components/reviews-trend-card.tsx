'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { presetRange } from '@/components/lp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { reviewTrendQueryOptions } from '../api/queries';

export interface ReviewsTrendCardProps {
  scope: string;
  from?: string;
  to?: string;
  className?: string;
}

/** Public stub (SDD-01T §3.5): area chart of reviews per day split positive / negative (F8 overview). */
export function ReviewsTrendCard({ scope, from, to, className }: ReviewsTrendCardProps) {
  const t = useTranslations('review-analytics.trendCard');
  const format = useFormatter();
  const range = from && to ? { from, to } : presetRange('30d');
  const { data, isPending } = useQuery(
    reviewTrendQueryOptions({ scope, from: range.from, to: range.to, granularity: 'day' })
  );
  const config = {
    positive: { label: t('positive'), color: 'var(--rating-positive)' },
    negative: { label: t('negative'), color: 'var(--rating-negative)' }
  } satisfies ChartConfig;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description', {
            from: format.dateTime(new Date(range.from), 'short'),
            to: format.dateTime(new Date(range.to), 'short')
          })}
        </CardDescription>
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
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(v) => format.dateTime(new Date(String(v)), 'medium')}
                  />
                }
              />
              <Area
                dataKey='positive'
                type='monotone'
                stackId='a'
                fill='var(--color-positive)'
                fillOpacity={0.3}
                stroke='var(--color-positive)'
              />
              <Area
                dataKey='negative'
                type='monotone'
                stackId='a'
                fill='var(--color-negative)'
                fillOpacity={0.3}
                stroke='var(--color-negative)'
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
