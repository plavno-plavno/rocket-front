'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { parseAsString, useQueryStates } from 'nuqs';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Icons } from '@/components/icons';
import {
  AnalyticsPage,
  PlatformIcon,
  RankHeatmap,
  StatusStatCard,
  presetRange
} from '@/components/lp';
import { AlertModal } from '@/components/modal/alert-modal';
import { Badge } from '@/components/ui/badge';
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { locationsQueryOptions } from '@/features/locations';
import { platformsQueryOptions } from '@/features/sources';
import { isApiError } from '@/lib/api';
import { deleteRankProjectMutation, runRankProjectMutation } from '../api/mutations';
import {
  rankCompetitorsQueryOptions,
  rankHeatmapQueryOptions,
  rankProjectsQueryOptions,
  rankTrendQueryOptions
} from '../api/queries';
import type { RankProject } from '../api/types';
import { RankProjectDialog } from './rank-project-dialog';

const errorText = (e: unknown) => (isApiError(e) ? (e.detail ?? e.message) : (e as Error).message);

const rankParams = {
  project: parseAsString.withDefault(''),
  location: parseAsString.withDefault(''),
  keyword: parseAsString.withDefault(''),
  platform: parseAsString.withDefault('')
};

/** S-RNK-01 «Трекер позиций»: projects, `RankHeatmap` for location × keyword × platform, ARP / SoLV trend, competitors. */
export function RankTracker({ access }: { access: boolean }) {
  return (
    <Suspense fallback={<Skeleton className='m-4 h-96' />}>
      <RankTrackerBody access={access} />
    </Suspense>
  );
}

function RankTrackerBody({ access }: { access: boolean }) {
  const t = useTranslations('rank');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const queryClient = useQueryClient();
  const [params, setParams] = useQueryStates(rankParams, { shallow: true });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RankProject | null>(null);
  const [deleting, setDeleting] = useState<RankProject | null>(null);

  const { data: projects, isPending: projectsPending } = useQuery(rankProjectsQueryOptions());
  const project =
    projects?.items.find((p) => p.id === params.project) ?? projects?.items[0] ?? null;
  const { data: platforms } = useQuery(platformsQueryOptions());
  const { data: locations } = useQuery({
    ...locationsQueryOptions({ scope: project?.scope ?? 'all', page: 1, page_size: 200 }),
    enabled: !!project
  });
  const locationItems = (locations?.items ?? []).filter(
    (l) => !project?.location_ids?.length || project.location_ids.includes(l.id)
  );
  const locationId = params.location || locationItems[0]?.id || '';
  const keyword = params.keyword || project?.keywords[0] || '';
  const platformId = params.platform || project?.platform_ids[0] || '';
  const selection = { location_id: locationId, keyword, platform_id: platformId };

  const run = useMutation(runRankProjectMutation(queryClient));
  const remove = useMutation(deleteRankProjectMutation(queryClient));
  const { data: heat, isPending: heatPending } = useQuery({
    ...rankHeatmapQueryOptions(project?.id ?? '', selection),
    enabled: !!project && !!locationId
  });
  const range = presetRange('quarter');
  const { data: trend } = useQuery({
    ...rankTrendQueryOptions(project?.id ?? '', { ...selection, from: range.from, to: range.to }),
    enabled: !!project && !!locationId
  });
  const { data: competitors } = useQuery({
    ...rankCompetitorsQueryOptions(project?.id ?? '', { keyword, platform_id: platformId }),
    enabled: !!project
  });

  const trendConfig = {
    arp: { label: t('trend.arp'), color: 'var(--chart-1)' },
    solv: { label: t('trend.solv'), color: 'var(--chart-2)' }
  } satisfies ChartConfig;

  const actions = (
    <div className='flex flex-wrap items-center gap-2'>
      {projects && projects.items.length > 0 && (
        <Select
          value={project?.id ?? ''}
          onValueChange={(v) =>
            setParams({ project: v ?? '', location: '', keyword: '', platform: '' })
          }
        >
          <SelectTrigger
            className='h-8 min-w-56'
            aria-label={t('project.select')}
            data-testid='rank-project-select'
          >
            <SelectValue>
              {(v: string) => projects.items.find((p) => p.id === v)?.name ?? ''}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projects.items.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button
        size='sm'
        variant='outline'
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
        data-testid='rank-project-create'
      >
        <Icons.add className='size-4' /> {t('project.create')}
      </Button>
    </div>
  );

  return (
    <AnalyticsPage
      title={t('page.title')}
      description={t('page.description')}
      infoContent={{
        title: t('page.title'),
        sections: [{ title: t('page.title'), description: t('page.info') }]
      }}
      actions={actions}
      access={access}
    >
      {projectsPending ? (
        <Skeleton className='h-96 lg:col-span-2' />
      ) : !project ? (
        <Empty className='lg:col-span-2' data-testid='rank-empty'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Icons.rank />
            </EmptyMedia>
            <EmptyTitle>{t('empty.title')}</EmptyTitle>
            <EmptyDescription>{t('empty.hint')}</EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => setDialogOpen(true)}>{t('project.create')}</Button>
        </Empty>
      ) : (
        <>
          <Card className='lg:col-span-2' data-testid='rank-project-card'>
            <CardHeader className='flex flex-row flex-wrap items-start justify-between gap-3'>
              <div className='flex flex-col gap-1.5'>
                <CardTitle className='flex items-center gap-2'>
                  {project.name}
                  <Badge variant='outline'>{t(`project.schedules.${project.schedule}`)}</Badge>
                  <Badge variant='outline'>
                    {project.grid.size} × {project.grid.size} ·{' '}
                    {format.number(project.grid.radius_m / 1000, { maximumFractionDigits: 1 })}{' '}
                    {t('project.km')}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {project.last_run_at
                    ? t('project.lastRun', {
                        when: format.relativeTime(new Date(project.last_run_at), now)
                      })
                    : t('project.neverRun')}
                </CardDescription>
              </div>
              <div className='flex items-center gap-1'>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={run.isPending}
                  onClick={() =>
                    run.mutate(
                      { id: project.id },
                      {
                        onSuccess: () => toast.success(t('project.runStarted')),
                        onError: (e) => toast.error(errorText(e))
                      }
                    )
                  }
                  data-testid='rank-run'
                >
                  {run.isPending ? (
                    <Icons.spinner className='size-4 animate-spin' />
                  ) : (
                    <Icons.refresh className='size-4' />
                  )}
                  {t('project.run')}
                </Button>
                <Button
                  size='icon-sm'
                  variant='ghost'
                  aria-label={t('project.edit')}
                  onClick={() => {
                    setEditing(project);
                    setDialogOpen(true);
                  }}
                >
                  <Icons.edit className='size-4' />
                </Button>
                <Button
                  size='icon-sm'
                  variant='ghost'
                  aria-label={t('project.delete')}
                  onClick={() => setDeleting(project)}
                >
                  <Icons.trash className='size-4' />
                </Button>
              </div>
            </CardHeader>
            <CardContent className='flex flex-wrap items-center gap-2'>
              <Select value={locationId} onValueChange={(v) => setParams({ location: v ?? '' })}>
                <SelectTrigger
                  className='h-8 min-w-64'
                  aria-label={t('controls.location')}
                  data-testid='rank-location'
                >
                  <SelectValue>
                    {(v: string) => locationItems.find((l) => l.id === v)?.name ?? '…'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {locationItems.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={keyword} onValueChange={(v) => setParams({ keyword: v ?? '' })}>
                <SelectTrigger
                  className='h-8 min-w-48'
                  aria-label={t('controls.keyword')}
                  data-testid='rank-keyword'
                >
                  <SelectValue>{(v: string) => v}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {project.keywords.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={platformId} onValueChange={(v) => setParams({ platform: v ?? '' })}>
                <SelectTrigger
                  className='h-8 min-w-44'
                  aria-label={t('controls.platform')}
                  data-testid='rank-platform'
                >
                  <SelectValue>
                    {(v: string) => platforms?.items.find((p) => p.id === v)?.name ?? v}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {project.platform_ids.map((id) => (
                    <SelectItem key={id} value={id}>
                      <span className='flex items-center gap-2'>
                        <PlatformIcon
                          platformId={id}
                          icon={platforms?.items.find((p) => p.id === id)?.icon ?? null}
                        />
                        {platforms?.items.find((p) => p.id === id)?.name ?? id}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className='grid gap-4 sm:grid-cols-3 lg:col-span-2'>
            <StatusStatCard
              title={t('kpi.arp')}
              value={
                heat?.arp == null ? '—' : format.number(heat.arp, { maximumFractionDigits: 1 })
              }
              icon='rank'
              hint={t('kpi.arpHint')}
              loading={heatPending}
            />
            <StatusStatCard
              title={t('kpi.solv')}
              value={
                heat?.solv == null
                  ? '—'
                  : `${format.number(heat.solv * 100, { maximumFractionDigits: 0 })} %`
              }
              icon='trendingUp'
              tone='text-status-synced'
              hint={t('kpi.solvHint')}
              loading={heatPending}
            />
            <StatusStatCard
              surface='violet'
              title={t('kpi.captured')}
              value={heat ? format.dateTime(new Date(heat.captured_at), 'medium') : '—'}
              icon='calendar'
              loading={heatPending}
            />
          </div>

          <Card data-testid='rank-heatmap-card'>
            <CardHeader>
              <CardTitle>{t('heatmap.title')}</CardTitle>
              <CardDescription>{t('heatmap.description', { keyword })}</CardDescription>
            </CardHeader>
            <CardContent>
              {heatPending || !heat ? (
                <Skeleton className='h-80' />
              ) : (
                <RankHeatmap
                  cells={heat.cells}
                  size={project.grid.size}
                  center={heat.center}
                  height={360}
                />
              )}
            </CardContent>
          </Card>

          <Card data-testid='rank-trend-card'>
            <CardHeader>
              <CardTitle>{t('trend.title')}</CardTitle>
              <CardDescription>{t('trend.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!trend ? (
                <Skeleton className='h-80' />
              ) : (
                <ChartContainer config={trendConfig} className='h-80 w-full'>
                  <LineChart
                    data={(trend.items ?? []).map((p) => ({
                      ...p,
                      solv: p.solv == null ? null : Math.round(p.solv * 100)
                    }))}
                    margin={{ left: 4, right: 4 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey='date'
                      tickLine={false}
                      axisLine={false}
                      minTickGap={32}
                      tickFormatter={(v: string) => format.dateTime(new Date(v), 'short')}
                    />
                    <YAxis
                      yAxisId='arp'
                      reversed
                      domain={[1, 20]}
                      width={28}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId='solv'
                      orientation='right'
                      domain={[0, 100]}
                      width={48}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v} %`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(v) => format.dateTime(new Date(String(v)), 'medium')}
                        />
                      }
                    />
                    <Line
                      yAxisId='arp'
                      dataKey='arp'
                      type='monotone'
                      stroke='var(--color-arp)'
                      dot={false}
                      connectNulls
                    />
                    <Line
                      yAxisId='solv'
                      dataKey='solv'
                      type='monotone'
                      stroke='var(--color-solv)'
                      dot={false}
                      connectNulls
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className='lg:col-span-2' data-testid='rank-competitors'>
            <CardHeader>
              <CardTitle>{t('competitors.title')}</CardTitle>
              <CardDescription>{t('competitors.description', { keyword })}</CardDescription>
            </CardHeader>
            <CardContent className='px-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-8 pl-6'>#</TableHead>
                    <TableHead>{t('competitors.name')}</TableHead>
                    <TableHead className='text-right'>{t('competitors.appearances')}</TableHead>
                    <TableHead className='pr-6 text-right'>{t('competitors.avgRank')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(competitors?.items ?? []).map((c, i) => (
                    <TableRow key={c.external_id}>
                      <TableCell className='text-muted-foreground pl-6 tabular-nums'>
                        {i + 1}
                      </TableCell>
                      <TableCell className='font-medium'>{c.name}</TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {format.number(c.appearances)}
                      </TableCell>
                      <TableCell className='pr-6 text-right tabular-nums'>
                        {format.number(c.avg_rank, { maximumFractionDigits: 1 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
      <RankProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editing}
        onCreated={(p) => setParams({ project: p.id, location: '', keyword: '', platform: '' })}
      />
      <AlertModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        loading={remove.isPending}
        title={t('project.delete')}
        description={deleting ? t('project.deleteConfirm', { name: deleting.name }) : ''}
        confirmLabel={t('project.deleteConfirmButton')}
        onConfirm={() =>
          deleting &&
          remove.mutate(
            { id: deleting.id },
            {
              onSuccess: () => {
                toast.success(t('project.deleted'));
                setDeleting(null);
                void setParams({ project: '', location: '', keyword: '', platform: '' });
              },
              onError: (e) => toast.error(errorText(e))
            }
          )
        }
      />
    </AnalyticsPage>
  );
}
