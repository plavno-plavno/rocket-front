'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { reviewStaffQueryOptions } from '../api/queries';
import { useAnalyticsParams } from '../hooks/use-analytics-params';
import { formatDuration } from '../lib/export';

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** S-ANL-06 «Сотрудники»: replies, average response time, resolved / open per team member. */
export function StaffTable() {
  const t = useTranslations('review-analytics.staff');
  const td = useTranslations('review-analytics.duration');
  const format = useFormatter();
  const { query } = useAnalyticsParams();
  const { data, isPending } = useQuery(
    reviewStaffQueryOptions({ ...query, page: 1, page_size: 100, sort: '-replies' })
  );
  const rows = data?.items ?? [];
  const max = Math.max(1, ...rows.map((r) => r.replies));

  return (
    <div className='overflow-x-auto rounded-lg border lg:col-span-2' data-testid='staff-table'>
      <Table>
        <TableHeader className='bg-muted'>
          <TableRow>
            <TableHead>{t('name')}</TableHead>
            <TableHead className='w-56'>{t('replies')}</TableHead>
            <TableHead className='text-right'>{t('responseTime')}</TableHead>
            <TableHead className='text-right'>{t('resolved')}</TableHead>
            <TableHead className='text-right'>{t('open')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending &&
            Array.from({ length: 4 }, (_, i) => (
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
          {rows.map((r) => (
            <TableRow key={r.user_id} data-user={r.user_id}>
              <TableCell>
                <span className='flex items-center gap-2'>
                  <Avatar className='size-7'>
                    <AvatarFallback className='text-[10px]'>{initials(r.name)}</AvatarFallback>
                  </Avatar>
                  <span className='font-medium'>{r.name}</span>
                </span>
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <Progress value={(r.replies / max) * 100} className='h-1.5 flex-1' />
                  <span className='w-8 text-right tabular-nums'>{format.number(r.replies)}</span>
                </div>
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {formatDuration(r.avg_response_time_s, td)}
              </TableCell>
              <TableCell className='text-status-synced text-right tabular-nums'>
                {format.number(r.resolved ?? 0)}
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {format.number(r.assigned_open ?? 0)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
