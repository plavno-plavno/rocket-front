import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AnalyticsScreen } from '@/features/review-analytics/components/analytics-screen';
import { RankingTable } from '@/features/review-analytics/components/ranking-table';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('review-analytics.screens');
  return { title: t('locations.title') };
}

/** S-ANL-02 — owned by UI-F4 (renders `AnalyticsPage` via AnalyticsScreen). */
export default async function Page() {
  const access = await requireAccess({ permission: 'analytics.read' });
  return (
    <AnalyticsScreen screen='locations' access={access}>
      <RankingTable dimension='locations' />
    </AnalyticsScreen>
  );
}
