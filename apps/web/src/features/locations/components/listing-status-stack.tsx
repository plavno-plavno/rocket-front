'use client';

import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';
import { PlatformIcon, SyncStatusBadge, SyncStatusDot } from '@/components/lp';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { platformsQueryOptions } from '@/features/sources';
import type { ListingStatusBrief } from '../api/types';

const ORDER = [
  'synced',
  'sent',
  'action_required',
  'error',
  'unsupported',
  'not_connected'
] as const;

/**
 * «Статусы по площадкам» cell (SCR-1): stack of platform marks with a status dot, hover-card with
 * details. Public API for other features is `LocationStatusStack({ locationId })` (index.ts).
 */
export function ListingStatusStack({
  statuses,
  max = 12
}: {
  statuses: ListingStatusBrief[];
  max?: number;
}) {
  const t = useTranslations('locations.listingHover');
  const format = useFormatter();
  const { data: platforms } = useQuery(platformsQueryOptions());
  const platformName = (id: string) => platforms?.items.find((p) => p.id === id)?.name ?? id;
  const platformIcon = (id: string) => platforms?.items.find((p) => p.id === id)?.icon;
  const visible = statuses
    .filter((s) => s.sync_status !== 'not_connected')
    .toSorted((a, b) => ORDER.indexOf(a.sync_status) - ORDER.indexOf(b.sync_status));
  const shown = visible.slice(0, max);
  const rest = visible.length - shown.length;

  return (
    <HoverCard>
      <HoverCardTrigger delay={200} render={<div className='flex items-center gap-1' />}>
        {shown.map((s) => (
          <span
            key={s.listing_id}
            className='relative inline-flex'
            title={`${platformName(s.platform_id)}`}
          >
            <PlatformIcon
              platformId={s.platform_id}
              icon={platformIcon(s.platform_id)}
              className='size-5'
            />
            <SyncStatusDot
              status={s.sync_status}
              className='ring-background absolute -right-0.5 -bottom-0.5 ring-2'
            />
          </span>
        ))}
        {rest > 0 && <span className='text-muted-foreground text-xs'>+{rest}</span>}
      </HoverCardTrigger>
      <HoverCardContent className='w-80 p-2' align='start'>
        <ul className='flex flex-col gap-1'>
          {visible.map((s) => (
            <li key={s.listing_id} className='flex items-center gap-2 text-sm'>
              <PlatformIcon
                platformId={s.platform_id}
                icon={platformIcon(s.platform_id)}
                className='size-4'
              />
              <span className='truncate'>{platformName(s.platform_id)}</span>
              <SyncStatusBadge status={s.sync_status} compact className='ml-auto' />
              {s.url && (
                <Link
                  href={s.url}
                  target='_blank'
                  rel='noreferrer'
                  className='text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline'
                  aria-label={t('open')}
                >
                  ↗
                </Link>
              )}
            </li>
          ))}
          {visible.length === 0 && (
            <li className='text-muted-foreground text-sm'>{t('notConnected')}</li>
          )}
        </ul>
        <p className='text-muted-foreground mt-2 text-xs'>
          {t('lastCheck', { date: format.dateTime(new Date(), 'time') })}
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}
