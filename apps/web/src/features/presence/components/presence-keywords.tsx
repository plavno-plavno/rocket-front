'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { PlatformIcon } from '@/components/lp';
import { Button } from '@/components/ui/button';
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
import { platformsQueryOptions } from '@/features/sources';
import { cn } from '@/lib/utils';
import { presenceKeywordsQueryOptions } from '../api/queries';
import { usePresenceParams } from '../hooks/use-presence-params';
import { PresencePlatformFilter } from './presence-overview';

/** Last 12 months as YYYY-MM, newest first. */
function lastMonths(n = 12): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) {
    out.push(d.toISOString().slice(0, 7));
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

/** S-PRS-01 «Поисковые фразы»: monthly keyword impressions per platform with trend. */
export function PresenceKeywords() {
  const t = useTranslations('presence.keywords');
  const format = useFormatter();
  const { params, setParams } = usePresenceParams();
  const months = lastMonths();
  const month = params.month || months[0]!;
  const { data: platforms } = useQuery(platformsQueryOptions());
  const { data, isPending, isPlaceholderData } = useQuery({
    ...presenceKeywordsQueryOptions({
      scope: params.scope || 'all',
      month,
      page: params.page,
      page_size: params.page_size,
      ...(params.q ? { q: params.q } : {}),
      ...(params.platform.length ? { 'filter[platform_id]': params.platform } : {})
    }),
    placeholderData: (prev) => prev
  });
  const rows = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / params.page_size));
  const max = Math.max(1, ...rows.map((r) => r.impressions));
  const monthLabel = (m: string) =>
    format.dateTime(new Date(`${m}-01T00:00:00`), { month: 'long', year: 'numeric' });

  return (
    <div className='flex flex-col gap-3 lg:col-span-2' data-testid='keywords-table'>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative min-w-56 flex-1'>
          <Icons.search className='text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2' />
          <Input
            value={params.q}
            onChange={(e) => setParams({ q: e.target.value, page: 1 })}
            placeholder={t('search')}
            className='h-8 pl-8'
            aria-label={t('search')}
          />
        </div>
        <Select value={month} onValueChange={(v) => setParams({ month: v ?? '', page: 1 })}>
          <SelectTrigger className='h-8 w-48' aria-label={t('month')} data-testid='keywords-month'>
            <SelectValue>{(v: string) => monthLabel(v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {monthLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <PresencePlatformFilter />
        <span className='text-muted-foreground text-xs'>{t('count', { count: total })}</span>
      </div>
      <div className={cn('overflow-x-auto rounded-lg border', isPlaceholderData && 'opacity-60')}>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead className='w-8'>#</TableHead>
              <TableHead>{t('keyword')}</TableHead>
              <TableHead>{t('platform')}</TableHead>
              <TableHead className='text-right'>{t('impressions')}</TableHead>
              <TableHead className='text-right'>{t('trend')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className='h-5 w-full' />
                  </TableCell>
                </TableRow>
              ))}
            {!isPending && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className='text-muted-foreground py-10 text-center text-sm'>
                  {t('empty')}
                </TableCell>
              </TableRow>
            )}
            {rows.map((r, i) => {
              const p = platforms?.items.find((x) => x.id === r.platform_id);
              const trend = r.trend_percent ?? null;
              return (
                <TableRow key={`${r.keyword}-${r.platform_id}`}>
                  <TableCell className='text-muted-foreground tabular-nums'>
                    {(params.page - 1) * params.page_size + i + 1}
                  </TableCell>
                  <TableCell>
                    <div className='flex min-w-48 flex-col gap-1'>
                      <span className='font-medium'>{r.keyword}</span>
                      <Progress value={(r.impressions / max) * 100} className='h-1' />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className='flex items-center gap-2'>
                      {r.platform_id && (
                        <PlatformIcon platformId={r.platform_id} icon={p?.icon ?? null} />
                      )}
                      {p?.name ?? r.platform_id ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {format.number(r.impressions)}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {trend == null ? (
                      '—'
                    ) : (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1',
                          trend > 0
                            ? 'text-status-synced'
                            : trend < 0
                              ? 'text-status-error'
                              : 'text-muted-foreground'
                        )}
                      >
                        {trend > 0 ? (
                          <Icons.trendingUp className='size-3.5' />
                        ) : trend < 0 ? (
                          <Icons.trendingDown className='size-3.5' />
                        ) : null}
                        {trend > 0 ? '+' : ''}
                        {format.number(trend)} %
                      </span>
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
