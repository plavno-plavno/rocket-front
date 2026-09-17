'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { StatusStatCard } from '@/components/lp';
import { listingsSummaryQueryOptions } from '@/features/locations';
import { badgesQueryOptions } from '@/features/session';
import { useScope } from '@/hooks/use-scope';

/** 4 KPI cards: synced / sent / action required listings + unanswered reviews (S-OVR-01 @kpi). */
export function OverviewKpis() {
  const t = useTranslations('overview.kpi');
  const ts = useTranslations('status');
  const router = useRouter();
  const [scope] = useScope();
  const { data: summary, isPending } = useSuspenseQuery(listingsSummaryQueryOptions(scope));
  const { data: badges } = useSuspenseQuery(badgesQueryOptions(scope));
  const counts = summary?.counts;
  const scopeQs = scope !== 'all' ? `&scope=${scope}` : '';
  return (
    <>
      <StatusStatCard
        title={ts('synced')}
        value={counts?.synced}
        total={counts?.total}
        ofLabel={counts ? t('ofListings', { total: counts.total }) : undefined}
        icon='circleCheck'
        tone='text-status-synced'
        loading={isPending}
        onClick={() => router.push(`/dashboard/locations?syncStatus=synced${scopeQs}`)}
      />
      <StatusStatCard
        title={ts('sent')}
        value={counts?.sent}
        total={counts?.total}
        ofLabel={counts ? t('ofListings', { total: counts.total }) : undefined}
        icon='send'
        tone='text-status-sent'
        loading={isPending}
        onClick={() => router.push(`/dashboard/locations?syncStatus=sent${scopeQs}`)}
      />
      <StatusStatCard
        title={ts('action_required')}
        value={counts?.action_required}
        total={counts?.total}
        ofLabel={counts ? t('ofListings', { total: counts.total }) : undefined}
        icon='warning'
        tone='text-status-action'
        loading={isPending}
        onClick={() => router.push(`/dashboard/locations?syncStatus=action_required${scopeQs}`)}
      />
      <StatusStatCard
        title={t('unanswered')}
        value={badges?.reviews_unanswered}
        icon='reviews'
        tone='text-rating-negative'
        loading={!badges}
        onClick={() => router.push(`/dashboard/reviews?has_reply=false${scopeQs}`)}
      />
    </>
  );
}
