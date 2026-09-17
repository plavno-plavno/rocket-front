'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { parseAsString, useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { PeriodPicker, StatusStatCard, presetRange, type PeriodValue } from '@/components/lp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
import { periodSearchParams } from '@/lib/searchparams';
import { campaignFunnelQueryOptions, reviewCampaignsQueryOptions } from '../api/queries';

const params = { ...periodSearchParams, campaign: parseAsString.withDefault('') };

/** S-GEN-01 «Аналитика»: funnel sent → opened → clicked → reviews per campaign and per day. */
export function CampaignAnalytics() {
  const t = useTranslations('review-generation.analytics');
  const format = useFormatter();
  const [p, setP] = useQueryStates(params, { shallow: true });
  const fallback = useMemo(() => presetRange('30d'), []);
  const period: PeriodValue = {
    from: p.from || fallback.from,
    to: p.to || fallback.to,
    granularity: p.granularity,
    compare: null
  };
  const { data: campaigns } = useQuery(reviewCampaignsQueryOptions({ page: 1, page_size: 100 }));
  const campaign = campaigns?.items.find((c) => c.id === p.campaign) ?? campaigns?.items[0];
  const { data, isPending } = useQuery({
    ...campaignFunnelQueryOptions(campaign?.id ?? '', { from: period.from, to: period.to }),
    enabled: !!campaign
  });
  const points = data?.items ?? [];
  const totals = points.reduce(
    (acc, x) => ({
      sent: acc.sent + x.sent,
      opened: acc.opened + x.opened,
      clicked: acc.clicked + x.clicked,
      reviews: acc.reviews + x.reviews_attributed
    }),
    { sent: 0, opened: 0, clicked: 0, reviews: 0 }
  );
  const isQr = campaign?.channel === 'qr';
  const funnel = [
    ...(isQr ? [] : [{ step: t('steps.sent'), value: totals.sent }]),
    { step: t('steps.opened'), value: totals.opened },
    { step: t('steps.clicked'), value: totals.clicked },
    { step: t('steps.reviews'), value: totals.reviews }
  ];
  const pct = (a: number, b: number) =>
    b ? `${format.number((a / b) * 100, { maximumFractionDigits: 1 })} %` : '—';
  const funnelConfig = {
    value: { label: t('count'), color: 'var(--chart-1)' }
  } satisfies ChartConfig;
  const dailyConfig = {
    opened: { label: t('steps.opened'), color: 'var(--chart-2)' },
    clicked: { label: t('steps.clicked'), color: 'var(--chart-3)' },
    reviews_attributed: { label: t('steps.reviews'), color: 'var(--chart-1)' }
  } satisfies ChartConfig;

  return (
    <div className='flex flex-col gap-4' data-testid='campaign-analytics'>
      <div className='flex flex-wrap items-center gap-2'>
        <Select value={campaign?.id ?? ''} onValueChange={(v) => setP({ campaign: v ?? '' })}>
          <SelectTrigger
            className='h-8 min-w-56'
            aria-label={t('campaign')}
            data-testid='analytics-campaign'
          >
            <SelectValue>
              {(v: string) => campaigns?.items.find((c) => c.id === v)?.name ?? ''}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(campaigns?.items ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <PeriodPicker
          value={period}
          onChange={(v) => setP({ from: v.from, to: v.to, granularity: v.granularity })}
        />
      </div>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatusStatCard
          title={t('steps.sent')}
          value={isQr ? '—' : format.number(totals.sent)}
          icon='send'
          loading={isPending}
          hint={isQr ? t('qrNoSend') : undefined}
        />
        <StatusStatCard
          surface='violet'
          title={t('steps.opened')}
          value={format.number(totals.opened)}
          icon='eye'
          loading={isPending}
          hint={isQr ? undefined : pct(totals.opened, totals.sent)}
        />
        <StatusStatCard
          surface='peach'
          title={t('steps.clicked')}
          value={format.number(totals.clicked)}
          icon='externalLink'
          loading={isPending}
          hint={pct(totals.clicked, totals.opened)}
        />
        <StatusStatCard
          title={t('steps.reviews')}
          value={format.number(totals.reviews)}
          icon='reviews'
          tone='text-status-synced'
          loading={isPending}
          hint={pct(totals.reviews, totals.clicked)}
        />
      </div>
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card data-testid='funnel-chart'>
          <CardHeader>
            <CardTitle>{t('funnel')}</CardTitle>
            <CardDescription>{t('funnelHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className='h-64' />
            ) : (
              <ChartContainer config={funnelConfig} className='h-64 w-full'>
                <BarChart data={funnel} layout='vertical' margin={{ left: 8, right: 24 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type='number' hide />
                  <YAxis
                    type='category'
                    dataKey='step'
                    width={110}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey='value' fill='var(--color-value)' radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card data-testid='daily-chart'>
          <CardHeader>
            <CardTitle>{t('daily')}</CardTitle>
            <CardDescription>{t('dailyHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className='h-64' />
            ) : (
              <ChartContainer config={dailyConfig} className='h-64 w-full'>
                <LineChart data={points} margin={{ left: 4, right: 4 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey='date'
                    tickLine={false}
                    axisLine={false}
                    minTickGap={32}
                    tickFormatter={(v: string) => format.dateTime(new Date(v), 'short')}
                  />
                  <YAxis width={36} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(v) => format.dateTime(new Date(String(v)), 'medium')}
                      />
                    }
                  />
                  {(Object.keys(dailyConfig) as (keyof typeof dailyConfig)[]).map((k) => (
                    <Line
                      key={k}
                      dataKey={k}
                      type='monotone'
                      stroke={`var(--color-${k})`}
                      dot={false}
                    />
                  ))}
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
