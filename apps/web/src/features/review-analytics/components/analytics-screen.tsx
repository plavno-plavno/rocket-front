'use client';

import { useTranslations } from 'next-intl';
import { Suspense, type ReactNode } from 'react';
import { AnalyticsPage } from '@/components/lp';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalyticsActions, AnalyticsFilters } from './analytics-header';
import { ReviewsKpis } from './reviews-panel';

export type AnalyticsScreenKey =
  | 'panel'
  | 'locations'
  | 'cities'
  | 'tags'
  | 'phrases'
  | 'staff'
  | 'topics'
  | 'concordance';

/**
 * Shell of every review-analytics screen (client): `AnalyticsPage` with the period / export actions,
 * the inline filters, the KPI row on the panel, and the screen body. Page routes pass `access`.
 */
export function AnalyticsScreen({
  screen,
  access,
  withKpi = false,
  children
}: {
  screen: AnalyticsScreenKey;
  access: boolean;
  withKpi?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations('review-analytics.screens');
  return (
    <Suspense fallback={<Skeleton className='m-4 h-96' />}>
      <AnalyticsPage
        title={t(`${screen}.title`)}
        description={t(`${screen}.description`)}
        infoContent={{
          title: t(`${screen}.title`),
          sections: [{ title: t(`${screen}.title`), description: t(`${screen}.info`) }]
        }}
        actions={
          <AnalyticsActions withGranularity={screen === 'panel'} withCompare={screen === 'panel'} />
        }
        filters={<AnalyticsFilters />}
        kpi={withKpi ? <ReviewsKpis /> : undefined}
        access={access}
      >
        {children}
      </AnalyticsPage>
    </Suspense>
  );
}
