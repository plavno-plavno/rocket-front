'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
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
import { presenceTrendQueryOptions } from '../api/queries';

export interface PresenceTrendCardProps {
  scope: string;
  from?: string;
  to?: string;
  className?: string;
}

/** Public stub (SDD-01T §3.5): stacked bars of target actions per day (calls / website / directions / other). */
export function PresenceTrendCard({ scope, from, to, className }: PresenceTrendCardProps) {
  const t = useTranslations('presence.trendCard');
  const format = useFormatter();
  const range = from && to ? { from, to } : presetRange('30d');
  const { data, isPending } = useQuery(
    presenceTrendQueryOptions({ scope, from: range.from, to: range.to, granularity: 'day' })
  );
  const config = {
    actions_calls: { label: t('calls'), color: 'var(--chart-1)' },
    actions_website: { label: t('website'), color: 'var(--chart-2)' },
    actions_directions: { label: t('directions'), color: 'var(--chart-3)' },
    actions_other: { label: t('other'), color: 'var(--chart-4)' }
  } satisfies ChartConfig;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className='h-56 w-full' />
        ) : (
          <ChartContainer config={config} className='h-56 w-full'>
            <BarChart data={data?.items ?? []} margin={{ left: 4, right: 4 }}>
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
              {(Object.keys(config) as (keyof typeof config)[]).map((k) => (
                <Bar
                  key={k}
                  dataKey={k}
                  stackId='a'
                  fill={`var(--color-${k})`}
                  radius={k === 'actions_other' ? [3, 3, 0, 0] : 0}
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
