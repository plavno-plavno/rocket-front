import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AnalyticsScreen } from '@/features/review-analytics/components/analytics-screen';
import { StaffTable } from '@/features/review-analytics/components/staff-table';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('review-analytics.screens');
  return { title: t('staff.title') };
}

/** S-ANL-06 — owned by UI-F4 (renders `AnalyticsPage` via AnalyticsScreen). */
export default async function Page() {
  const access = await requireAccess({ permission: 'analytics.read' });
  return (
    <AnalyticsScreen screen='staff' access={access}>
      <StaffTable />
    </AnalyticsScreen>
  );
}
