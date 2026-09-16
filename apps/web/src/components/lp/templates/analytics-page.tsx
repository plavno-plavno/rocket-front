import type { ReactNode } from 'react';
import PageContainer from '@/components/layout/page-container';
import type { InfobarContent } from '@/components/ui/infobar';

export interface AnalyticsPageProps {
  title: string;
  description?: string;
  infoContent?: InfobarContent;
  /** Header actions: PeriodPicker, export. */
  actions?: ReactNode;
  /** Inline filters row (region / brand / city). */
  filters?: ReactNode;
  /** KPI cards. */
  kpi?: ReactNode;
  /** Charts / tables grid. */
  children: ReactNode;
  access?: boolean;
}

/** Analytics screen template (SDD-01T §3.6): header + period, filters, KPI row, grid. */
export function AnalyticsPage({
  title,
  description,
  infoContent,
  actions,
  filters,
  kpi,
  children,
  access = true
}: AnalyticsPageProps) {
  return (
    <PageContainer
      pageTitle={title}
      pageDescription={description}
      infoContent={infoContent}
      pageHeaderAction={actions}
      access={access}
    >
      <div className='flex flex-1 flex-col gap-4' data-template='analytics'>
        {filters && <div className='flex flex-wrap items-center gap-2'>{filters}</div>}
        {kpi && (
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6'>{kpi}</div>
        )}
        <div className='grid gap-4 lg:grid-cols-2'>{children}</div>
      </div>
    </PageContainer>
  );
}
