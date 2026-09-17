'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { PlatformIcon, SyncStatusBadge, SyncStatusDot } from '@/components/lp';
import { LinkButton } from '@/components/ui/link-button';
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
import { platformsQueryOptions } from '@/features/sources';
import { presenceSyncMatrixQueryOptions } from '../api/queries';
import { usePresenceParams } from '../hooks/use-presence-params';

const STATUSES = [
  'synced',
  'sent',
  'action_required',
  'error',
  'not_connected',
  'unsupported'
] as const;

/** S-PRS-01 «Синхронизация на площадках»: platform × listing status matrix within the global scope. */
export function PresenceSync() {
  const t = useTranslations('presence.sync');
  const format = useFormatter();
  const { params } = usePresenceParams();
  const { data, isPending } = useQuery(
    presenceSyncMatrixQueryOptions({ scope: params.scope || 'all' })
  );
  const { data: platforms } = useQuery(platformsQueryOptions());
  const cells = data?.items ?? [];
  const totals = STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: cells.reduce((sum, c) => sum + c.counts[s], 0) }),
    {} as Record<(typeof STATUSES)[number], number>
  );

  return (
    <div className='flex flex-col gap-3 lg:col-span-2' data-testid='sync-matrix'>
      <div className='flex flex-wrap items-center gap-2'>
        {STATUSES.map((s) => (
          <SyncStatusBadge key={s} status={s} />
        ))}
        <LinkButton href='/dashboard/sources' variant='ghost' size='sm' className='ml-auto'>
          {t('toSources')}
        </LinkButton>
      </div>
      <div className='overflow-x-auto rounded-lg border'>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>{t('platform')}</TableHead>
              {STATUSES.map((s) => (
                <TableHead key={s} className='text-right'>
                  <span className='inline-flex items-center gap-1.5'>
                    <SyncStatusDot status={s} /> {t(`status.${s}`)}
                  </span>
                </TableHead>
              ))}
              <TableHead className='text-right'>{t('total')}</TableHead>
              <TableHead className='w-40'>{t('coverage')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}>
                    <Skeleton className='h-5 w-full' />
                  </TableCell>
                </TableRow>
              ))}
            {cells.map((c) => {
              const p = platforms?.items.find((x) => x.id === c.platform_id);
              const coverage = c.counts.total ? (c.counts.synced / c.counts.total) * 100 : 0;
              return (
                <TableRow key={c.platform_id} data-platform={c.platform_id}>
                  <TableCell>
                    <span className='flex items-center gap-2'>
                      <PlatformIcon platformId={c.platform_id} icon={p?.icon ?? null} />
                      <span className='font-medium'>{p?.name ?? c.platform_id}</span>
                    </span>
                  </TableCell>
                  {STATUSES.map((s) => (
                    <TableCell key={s} className='text-right tabular-nums'>
                      {c.counts[s] > 0 ? (
                        format.number(c.counts[s])
                      ) : (
                        <span className='text-muted-foreground'>—</span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className='text-right font-medium tabular-nums'>
                    {format.number(c.counts.total)}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Progress value={coverage} className='h-1.5 flex-1' />
                      <span className='w-10 text-right text-xs tabular-nums'>
                        {Math.round(coverage)} %
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!isPending && cells.length > 0 && (
              <TableRow className='bg-muted/50 font-medium'>
                <TableCell>{t('allPlatforms')}</TableCell>
                {STATUSES.map((s) => (
                  <TableCell key={s} className='text-right tabular-nums'>
                    {format.number(totals[s])}
                  </TableCell>
                ))}
                <TableCell className='text-right tabular-nums'>
                  {format.number(STATUSES.reduce((sum, s) => sum + totals[s], 0))}
                </TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
