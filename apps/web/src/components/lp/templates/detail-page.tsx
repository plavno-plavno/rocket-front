import type { ReactNode } from 'react';
import PageContainer from '@/components/layout/page-container';
import type { InfobarContent } from '@/components/ui/infobar';

export interface DetailPageProps {
  title: string;
  description?: string;
  infoContent?: InfobarContent;
  actions?: ReactNode;
  /** Tabs row (Данные / Площадки / История / Отзывы). */
  tabs?: ReactNode;
  /** Right column (status, meta). Hidden below `xl`. */
  aside?: ReactNode;
  children: ReactNode;
  access?: boolean;
}

/** Detail screen template (SDD-01T §3.6): header, tabs, main + aside. */
export function DetailPage({
  title,
  description,
  infoContent,
  actions,
  tabs,
  aside,
  children,
  access = true
}: DetailPageProps) {
  return (
    <PageContainer
      pageTitle={title}
      pageDescription={description}
      infoContent={infoContent}
      pageHeaderAction={actions}
      access={access}
    >
      <div className='flex flex-1 flex-col gap-4' data-template='detail'>
        {tabs}
        <div className='grid flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]'>
          <div className='flex min-w-0 flex-col gap-4'>{children}</div>
          {aside && <aside className='flex flex-col gap-4'>{aside}</aside>}
        </div>
      </div>
    </PageContainer>
  );
}
