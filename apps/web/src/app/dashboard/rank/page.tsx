import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { RankTracker } from '@/features/rank/components/rank-tracker';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('rank.page');
  return { title: t('title') };
}

/** S-RNK-01 «Трекер позиций» — owned by UI-F4 (renders `AnalyticsPage`). */
export default async function Page() {
  const access = await requireAccess({ permission: 'analytics.read', feature: 'rank_tracker' });
  return <RankTracker access={access} />;
}
