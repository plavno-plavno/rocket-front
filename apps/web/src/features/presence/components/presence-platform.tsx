'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Icons } from '@/components/icons';
import { PlatformIcon } from '@/components/lp';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { LinkButton } from '@/components/ui/link-button';
import { platformsQueryOptions } from '@/features/sources';
import { useBreadcrumbTitle } from '@/shell/breadcrumb-store';
import { presencePlatformQueryOptions } from '../api/queries';
import { usePresenceParams } from '../hooks/use-presence-params';
import { ImpressionsCard, PresenceKpis } from './presence-overview';
import { PresenceTrendCard } from './presence-trend-card';

/** S-PRS-01 `platform/[platformId]`: the same KPI + charts for one platform, or an explicit «no statistics» state. */
export function PresencePlatform({ platformId }: { platformId: string }) {
  const t = useTranslations('presence.platforms');
  const { query, period } = usePresenceParams();
  const { data: platforms } = useQuery(platformsQueryOptions());
  const platform = platforms?.items.find((p) => p.id === platformId);
  useBreadcrumbTitle(`/dashboard/presence/platform/${platformId}`, platform?.name);
  const { data, isPending } = useQuery(presencePlatformQueryOptions(platformId, query));
  const noData = !isPending && (data?.summary.platforms_without_data ?? []).includes(platformId);

  return (
    <>
      <div className='flex items-center gap-3 lg:col-span-2' data-testid='platform-header'>
        <PlatformIcon platformId={platformId} icon={platform?.icon ?? null} className='size-8' />
        <div>
          <h3 className='text-lg font-semibold'>{platform?.name ?? platformId}</h3>
          {platform?.website && (
            <a
              href={platform.website}
              target='_blank'
              rel='noreferrer'
              className='text-muted-foreground text-xs underline-offset-4 hover:underline'
            >
              {platform.website}
            </a>
          )}
        </div>
        <LinkButton href='/dashboard/presence' variant='ghost' size='sm' className='ml-auto'>
          <Icons.chevronLeft className='size-4' /> {t('back')}
        </LinkButton>
      </div>
      {noData ? (
        <Empty className='lg:col-span-2' data-testid='platform-no-data'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Icons.analytics />
            </EmptyMedia>
            <EmptyTitle>{t('noStatsTitle')}</EmptyTitle>
            <EmptyDescription>
              {t('noStatsOne', { platform: platform?.name ?? platformId })}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className='grid gap-4 sm:grid-cols-2 lg:col-span-2 2xl:grid-cols-6'>
            <PresenceKpis platformId={platformId} />
          </div>
          <PresenceTrendCard
            scope={query.scope}
            from={query.from}
            to={query.to}
            granularity={period.granularity}
            platformIds={[platformId]}
          />
          <ImpressionsCard platformId={platformId} />
        </>
      )}
    </>
  );
}
