'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { Icons } from '@/components/icons';
import { PlatformIcon, StatusStatCard } from '@/components/lp';
import { Badge } from '@/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCan } from '@/features/session';
import { platformsQueryOptions } from '@/features/sources';
import { useScope } from '@/hooks/use-scope';
import { isApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { duplicatesQueryOptions, duplicatesSummaryQueryOptions } from '../api/queries';
import type { DuplicateCase } from '../api/types';
import { DuplicateSheet } from './duplicate-sheet';

const KINDS = ['duplicate', 'fake', 'conflicting_owner'] as const;
const ALL = '__all__';

const KIND_TONE: Record<DuplicateCase['kind'], string> = {
  duplicate: 'text-status-sent',
  fake: 'text-status-error',
  conflicting_owner: 'text-status-action'
};
const STATE_TONE: Record<DuplicateCase['state'], string> = {
  open: 'text-status-action',
  confirmed: 'text-status-synced',
  dismissed: 'text-muted-foreground',
  merged: 'text-status-synced',
  reported: 'text-status-error'
};

const params = {
  state: parseAsStringLiteral(['open', 'resolved', 'all'] as const).withDefault('open'),
  kind: parseAsString.withDefault(''),
  platform: parseAsString.withDefault(''),
  q: parseAsString.withDefault(''),
  case: parseAsString.withDefault('')
};

export const errorText = (e: unknown) =>
  isApiError(e) ? (e.detail ?? e.message) : (e as Error).message;

/** S-DUP-01 «Дубли и фейки»: KPI (open / duplicates / fakes / owner conflicts), faceted queue, detail sheet. */
export function DuplicatesQueue() {
  const t = useTranslations('duplicates');
  const format = useFormatter();
  const [scope] = useScope();
  const [p, setP] = useQueryStates(params, { shallow: true });
  const canEdit = useCan('locations.edit');
  const { data: summary } = useQuery(duplicatesSummaryQueryOptions({ scope: scope ?? 'all' }));
  const { data: platforms } = useQuery(platformsQueryOptions());
  const { data, isPending, isPlaceholderData } = useQuery({
    ...duplicatesQueryOptions({
      scope: scope ?? 'all',
      page: 1,
      page_size: 100,
      ...(p.q ? { q: p.q } : {}),
      ...(p.kind ? { 'filter[kind]': [p.kind as DuplicateCase['kind']] } : {}),
      ...(p.platform ? { 'filter[platform_id]': [p.platform] } : {}),
      ...(p.state === 'open' ? { 'filter[state]': ['open' as const] } : {})
    }),
    placeholderData: (prev) => prev
  });
  const items = (data?.items ?? []).filter((d) => p.state !== 'resolved' || d.state !== 'open');
  const selected = items.find((d) => d.id === p.case) ?? null;

  return (
    <div className='flex flex-col gap-4' data-testid='duplicates-queue'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatusStatCard
          title={t('kpi.open')}
          value={summary?.open ?? null}
          icon='duplicates'
          tone='text-status-action'
          active={!p.kind && p.state === 'open'}
          onClick={() => setP({ kind: '', state: 'open', case: '' })}
        />
        <StatusStatCard
          title={t('kpi.duplicates')}
          value={summary?.duplicates ?? null}
          icon='copy'
          tone='text-status-sent'
          active={p.kind === 'duplicate'}
          onClick={() =>
            setP({ kind: p.kind === 'duplicate' ? '' : 'duplicate', state: 'open', case: '' })
          }
        />
        <StatusStatCard
          title={t('kpi.fakes')}
          value={summary?.fakes ?? null}
          icon='alertCircle'
          tone='text-status-error'
          active={p.kind === 'fake'}
          onClick={() => setP({ kind: p.kind === 'fake' ? '' : 'fake', state: 'open', case: '' })}
        />
        <StatusStatCard
          title={t('kpi.conflicting')}
          value={summary?.conflicting_owner ?? null}
          icon='userOff'
          tone='text-status-neutral'
          active={p.kind === 'conflicting_owner'}
          onClick={() =>
            setP({
              kind: p.kind === 'conflicting_owner' ? '' : 'conflicting_owner',
              state: 'open',
              case: ''
            })
          }
        />
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <Tabs value={p.state} onValueChange={(v) => setP({ state: v as typeof p.state, case: '' })}>
          <TabsList>
            <TabsTrigger value='open'>{t('tabs.open')}</TabsTrigger>
            <TabsTrigger value='resolved'>{t('tabs.resolved')}</TabsTrigger>
            <TabsTrigger value='all'>{t('tabs.all')}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className='relative min-w-56 flex-1'>
          <Icons.search className='text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2' />
          <Input
            value={p.q}
            onChange={(e) => setP({ q: e.target.value })}
            placeholder={t('search')}
            className='h-8 pl-8'
            aria-label={t('search')}
          />
        </div>
        <Select
          value={p.kind || ALL}
          onValueChange={(v) => setP({ kind: !v || v === ALL ? '' : v })}
        >
          <SelectTrigger
            className='h-8 w-44'
            aria-label={t('filters.kind')}
            data-testid='filter-kind'
          >
            <SelectValue>
              {(v: string) =>
                v === ALL ? t('filters.anyKind') : t(`kinds.${v as DuplicateCase['kind']}`)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('filters.anyKind')}</SelectItem>
            {KINDS.map((k) => (
              <SelectItem key={k} value={k}>
                {t(`kinds.${k}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={p.platform || ALL}
          onValueChange={(v) => setP({ platform: !v || v === ALL ? '' : v })}
        >
          <SelectTrigger className='h-8 w-48' aria-label={t('filters.platform')}>
            <SelectValue>
              {(v: string) =>
                v === ALL
                  ? t('filters.anyPlatform')
                  : (platforms?.items.find((x) => x.id === v)?.name ?? v)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('filters.anyPlatform')}</SelectItem>
            {(platforms?.items ?? []).map((x) => (
              <SelectItem key={x.id} value={x.id}>
                {x.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={cn('overflow-x-auto rounded-lg border', isPlaceholderData && 'opacity-60')}>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>{t('columns.listing')}</TableHead>
              <TableHead>{t('columns.location')}</TableHead>
              <TableHead>{t('columns.platform')}</TableHead>
              <TableHead>{t('columns.kind')}</TableHead>
              <TableHead className='w-36'>{t('columns.score')}</TableHead>
              <TableHead>{t('columns.state')}</TableHead>
              <TableHead>{t('columns.created')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className='h-5 w-full' />
                  </TableCell>
                </TableRow>
              ))}
            {!isPending && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Empty className='py-8'>
                    <EmptyHeader>
                      <EmptyMedia variant='icon'>
                        <Icons.duplicates />
                      </EmptyMedia>
                      <EmptyTitle>
                        {p.q || p.kind || p.platform ? t('emptyFiltered') : t('empty')}
                      </EmptyTitle>
                      <EmptyDescription>{t('emptyHint')}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {items.map((d) => (
              <TableRow
                key={d.id}
                data-case={d.id}
                data-state={d.state}
                className={cn('cursor-pointer', selected?.id === d.id && 'bg-accent/50')}
                onClick={() => setP({ case: d.id })}
              >
                <TableCell>
                  <div className='font-medium'>{d.listing.observed_name ?? '—'}</div>
                  <div className='text-muted-foreground max-w-64 truncate text-xs'>
                    {d.listing.observed_address ?? ''}
                  </div>
                </TableCell>
                <TableCell className='max-w-56 truncate'>{d.location_name}</TableCell>
                <TableCell>
                  <span className='flex items-center gap-2'>
                    <PlatformIcon
                      platformId={d.platform_id}
                      icon={platforms?.items.find((x) => x.id === d.platform_id)?.icon ?? null}
                    />
                    {platforms?.items.find((x) => x.id === d.platform_id)?.name ?? d.platform_id}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant='outline' className={cn('gap-1', KIND_TONE[d.kind])}>
                    <span className='size-1.5 rounded-full bg-current' aria-hidden />
                    {t(`kinds.${d.kind}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Progress value={d.score * 100} className='h-1.5 flex-1' />
                    <span className='w-10 text-right text-xs tabular-nums'>
                      {Math.round(d.score * 100)} %
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant='outline' className={cn('gap-1', STATE_TONE[d.state])}>
                    <span className='size-1.5 rounded-full bg-current' aria-hidden />
                    {t(`states.${d.state}`)}
                  </Badge>
                </TableCell>
                <TableCell className='text-muted-foreground text-xs'>
                  <time dateTime={d.created_at}>
                    {format.dateTime(new Date(d.created_at), 'short')}
                  </time>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DuplicateSheet
        caseId={p.case || null}
        onClose={() => setP({ case: '' })}
        canEdit={canEdit}
      />
    </div>
  );
}
