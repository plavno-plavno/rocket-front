import type { ReactNode } from 'react';
import PageContainer from '@/components/layout/page-container';
import type { InfobarContent } from '@/components/ui/infobar';

export interface ListPageProps {
  title: string;
  description?: string;
  infoContent?: InfobarContent;
  /** Header actions (buttons). */
  actions?: ReactNode;
  /** Tabs row under the header. */
  tabs?: ReactNode;
  /** KPI cards row. */
  kpi?: ReactNode;
  /** Table (with its toolbar) — the main content. */
  children: ReactNode;
  access?: boolean;
}

/**
 * List screen template (SDD-01T §3.6): header actions, tabs, KPI row, table.
 * Every list route renders this so screens stay consistent across tracks.
 */
export function ListPage({
  title,
  description,
  infoContent,
  actions,
  tabs,
  kpi,
  children,
  access = true
}: ListPageProps) {
  return (
    <PageContainer
      pageTitle={title}
      pageDescription={description}
      infoContent={infoContent}
      pageHeaderAction={actions}
      access={access}
    >
      <div className='flex flex-1 flex-col gap-4' data-template='list'>
        {tabs}
        {kpi && (
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>{kpi}</div>
        )}
        {children}
      </div>
    </PageContainer>
  );
}
