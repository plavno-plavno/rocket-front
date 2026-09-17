'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { toast } from 'sonner';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Icons } from '@/components/icons';
import { AnalyticsPage, PeriodPicker, PlatformIcon, StatusStatCard } from '@/components/lp';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { deltaOf, waitForExport } from '@/features/review-analytics';
import { platformsQueryOptions } from '@/features/sources';
import { isApiError } from '@/lib/api';
import { exportPresenceMutation } from '../api/mutations';
import { presenceSummaryQueryOptions, presenceTrendQueryOptions } from '../api/queries';
import { getExport } from '../api/service';
import { usePresenceParams } from '../hooks/use-presence-params';
import { PresenceTrendCard } from './presence-trend-card';

const ALL = '__all__';

/** Header: period (+ granularity / compare) and «Скачать данные». */
export function PresenceActions({ withCompare = true }: { withCompare?: boolean }) {
  const t = useTranslations('presence.actions');
  const tc = useTranslations('common');
  const queryClient = useQueryClient();
  const { period, setPeriod, query } = usePresenceParams();
  const exp = useMutation(exportPresenceMutation(queryClient));
  const download = async () => {
    const id = toast.loading(t('exportStarted'));
    try {
      const { scope, ...rest } = query;
      const started = await exp.mutateAsync({
        body: { kind: 'presence', format: 'xlsx', params: rest },
        params: { scope }
      });
      const done = await waitForExport(getExport, started.id);
      toast.success(tc('exportReady'), {
        id,
        action: { label: tc('download'), onClick: () => window.open(done.download_url!, '_blank') }
      });
    } catch (e) {
      toast.error(isApiError(e) ? (e.detail ?? e.message) : (e as Error).message, { id });
    }
  };
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <PeriodPicker value={period} onChange={setPeriod} withGranularity withCompare={withCompare} />
      <Button
        variant='outline'
        size='sm'
        onClick={download}
        disabled={exp.isPending}
        data-testid='presence-export'
      >
        <Icons.download className='size-4' /> {t('export')}
      </Button>
    </div>
  );
}

/** Platform filter of the presence screens (single platform or all). */
export function PresencePlatformFilter() {
  const t = useTranslations('presence.filters');
  const { params, setParams } = usePresenceParams();
  const { data: platforms } = useQuery(platformsQueryOptions());
  return (
    <Select
      value={params.platform[0] ?? ALL}
      onValueChange={(v) => setParams({ platform: !v || v === ALL ? [] : [v], page: 1 })}
    >
      <SelectTrigger
        className='h-8 min-w-44'
        aria-label={t('platform')}
        data-testid='presence-platform'
      >
        <SelectValue>
          {(v: string) =>
            v === ALL ? t('allPlatforms') : (platforms?.items.find((p) => p.id === v)?.name ?? v)
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{t('allPlatforms')}</SelectItem>
        {(platforms?.items ?? []).map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <span className='flex items-center gap-2'>
              <PlatformIcon platformId={p.id} icon={p.icon} />
              {p.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Shell of every presence screen (client): `AnalyticsPage` + period + platform filter. */
export function PresenceScreen({
  screen,
  access,
  kpi,
  actions,
  children
}: {
  screen: 'overview' | 'sync' | 'keywords' | 'platform';
  access: boolean;
  kpi?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations('presence.screens');
  return (
    <Suspense fallback={<Skeleton className='m-4 h-96' />}>
      <AnalyticsPage
        title={t(`${screen}.title`)}
        description={t(`${screen}.description`)}
        infoContent={{
          title: t(`${screen}.title`),
          sections: [{ title: t(`${screen}.title`), description: t(`${screen}.info`) }]
        }}
        actions={actions}
        filters={screen === 'overview' ? <PresencePlatformFilter /> : undefined}
        kpi={kpi}
        access={access}
      >
        {children}
      </AnalyticsPage>
    </Suspense>
  );
}

/** KPI cards of S-PRS-01: impressions, target actions, conversion — deltas with a comparison period. */
export function PresenceKpis({ platformId }: { platformId?: string } = {}) {
  const t = useTranslations('presence.kpi');
  const format = useFormatter();
  const { query, compareQuery } = usePresenceParams();
  const q = platformId ? { ...query, 'filter[platform_id]': [platformId] } : query;
  const { data, isPending } = useQuery(presenceSummaryQueryOptions({ ...q, ...compareQuery }));
  const pct = (v: number) => format.number(v, { maximumFractionDigits: 1 });
  return (
    <>
      <StatusStatCard
        title={t('impressions')}
        value={data?.impressions.value == null ? null : format.number(data.impressions.value)}
        icon='eye'
        loading={isPending}
        className='2xl:col-span-2'
        {...deltaOf(data?.impressions, pct)}
      />
      <StatusStatCard
        title={t('actions')}
        value={data?.actions.value == null ? null : format.number(data.actions.value)}
        icon='phone'
        tone='text-status-synced'
        loading={isPending}
        className='2xl:col-span-2'
        hint={
          data
            ? t('actionsHint', {
                calls: data.by_action.calls,
                website: data.by_action.website,
                directions: data.by_action.directions
              })
            : undefined
        }
        {...deltaOf(data?.actions, pct)}
      />
      <StatusStatCard
        title={t('conversion')}
        value={data?.conversion.value == null ? null : `${pct(data.conversion.value * 100)} %`}
        icon='trendingUp'
        loading={isPending}
        className='2xl:col-span-2'
        {...deltaOf(data?.conversion, pct)}
      />
    </>
  );
}

/** Impressions over time (maps / search) — line chart. */
export function ImpressionsCard({ platformId }: { platformId?: string } = {}) {
  const t = useTranslations('presence.impressions');
  const format = useFormatter();
  const { query, period } = usePresenceParams();
  const q = platformId ? { ...query, 'filter[platform_id]': [platformId] } : query;
  const { data, isPending } = useQuery(
    presenceTrendQueryOptions({ ...q, granularity: period.granularity })
  );
  const config = {
    impressions_maps: { label: t('maps'), color: 'var(--chart-1)' },
    impressions_search: { label: t('search'), color: 'var(--chart-2)' }
  } satisfies ChartConfig;
  const empty = !isPending && (data?.items ?? []).every((p) => p.impressions_total == null);
  return (
    <Card data-testid='impressions-card'>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className='h-56 w-full' />
        ) : empty ? (
          <p className='text-muted-foreground flex h-56 items-center justify-center text-sm'>
            {t('noData')}
          </p>
        ) : (
          <ChartContainer config={config} className='h-56 w-full'>
            <LineChart data={data?.items ?? []} margin={{ left: 4, right: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                minTickGap={32}
                tickFormatter={(v: string) => format.dateTime(new Date(v), 'short')}
              />
              <YAxis
                width={56}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => format.number(v, { notation: 'compact' })}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(v) => format.dateTime(new Date(String(v)), 'medium')}
                  />
                }
              />
              <Line
                dataKey='impressions_maps'
                type='monotone'
                stroke='var(--color-impressions_maps)'
                dot={false}
                connectNulls
              />
              <Line
                dataKey='impressions_search'
                type='monotone'
                stroke='var(--color-impressions_search)'
                dot={false}
                connectNulls
              />
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

/** Platforms that report no statistics — «Площадка не предоставляет статистику», not zeros. */
function PlatformsWithoutData() {
  const t = useTranslations('presence.platforms');
  const { query } = usePresenceParams();
  const { data } = useQuery(presenceSummaryQueryOptions(query));
  const { data: platforms } = useQuery(platformsQueryOptions());
  const ids = data?.platforms_without_data ?? [];
  if (ids.length === 0) return null;
  const names = ids.map((id) => platforms?.items.find((p) => p.id === id)?.name ?? id);
  return (
    <Alert className='lg:col-span-2' data-testid='platforms-without-data'>
      <Icons.info className='size-4' />
      <AlertTitle>{t('noStatsTitle')}</AlertTitle>
      <AlertDescription>{t('noStats', { platforms: names.join(', ') })}</AlertDescription>
    </Alert>
  );
}

/** Per-platform cards linking to `/dashboard/presence/platform/[platformId]`. */
function PlatformLinks() {
  const t = useTranslations('presence.platforms');
  const { data } = useQuery(presenceSummaryQueryOptions(usePresenceParams().query));
  const { data: platforms } = useQuery(platformsQueryOptions());
  const without = new Set(data?.platforms_without_data ?? []);
  return (
    <Card className='lg:col-span-2' data-testid='platform-links'>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-2 sm:grid-cols-2 xl:grid-cols-4'>
        {(platforms?.items ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/presence/platform/${p.id}`}
            className='hover:bg-accent/50 flex items-center gap-2 rounded-md border px-3 py-2 text-sm'
          >
            <PlatformIcon platformId={p.id} icon={p.icon} />
            <span className='min-w-0 flex-1 truncate font-medium'>{p.name}</span>
            {without.has(p.id) ? (
              <span className='text-muted-foreground text-xs'>{t('noStatsShort')}</span>
            ) : (
              <Icons.chevronRight className='text-muted-foreground size-4' />
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

/** S-PRS-01 body: actions bars, impressions lines, platforms without data, per-platform links. */
export function PresenceOverview() {
  const { query, period, params } = usePresenceParams();
  return (
    <>
      <PlatformsWithoutData />
      <PresenceTrendCard
        scope={query.scope}
        from={query.from}
        to={query.to}
        granularity={period.granularity}
        platformIds={params.platform}
      />
      <ImpressionsCard />
      <PlatformLinks />
    </>
  );
}
