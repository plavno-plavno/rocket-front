'use client';

import type { ReactNode } from 'react';
import PageContainer from '@/components/layout/page-container';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import type { InfobarContent } from '@/components/ui/infobar';

export interface InboxPageProps {
  title: string;
  description?: string;
  infoContent?: InfobarContent;
  actions?: ReactNode;
  kpi?: ReactNode;
  /** Left list (items). */
  list: ReactNode;
  /** Centre detail. */
  detail: ReactNode;
  /** Right filters (pinned ≥ 1536px; below that the consumer renders a Sheet trigger in `actions`). */
  filters?: ReactNode;
  access?: boolean;
}

/** Inbox template (SDD-01T §3.6): KPI row + resizable list | detail | filters. Works from 390px. */
export function InboxPage({
  title,
  description,
  infoContent,
  actions,
  kpi,
  list,
  detail,
  filters,
  access = true
}: InboxPageProps) {
  return (
    <PageContainer
      pageTitle={title}
      pageDescription={description}
      infoContent={infoContent}
      pageHeaderAction={actions}
      access={access}
    >
      <div className='flex flex-1 flex-col gap-4' data-template='inbox'>
        {kpi && <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-5'>{kpi}</div>}
        <div className='relative flex-1'>
          <div className='absolute inset-0 overflow-hidden rounded-lg border'>
            <ResizablePanelGroup orientation='horizontal' className='h-full'>
              <ResizablePanel defaultSize={34} minSize={20} className='min-w-0'>
                {list}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={filters ? 46 : 66} minSize={30} className='min-w-0'>
                {detail}
              </ResizablePanel>
              {filters && (
                <>
                  <ResizableHandle withHandle className='hidden 2xl:flex' />
                  <ResizablePanel
                    defaultSize={20}
                    minSize={15}
                    className='hidden min-w-0 2xl:block'
                  >
                    {filters}
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
