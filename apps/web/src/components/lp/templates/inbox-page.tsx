'use client';

import { useTranslations } from 'next-intl';
import { useQueryState } from 'nuqs';
import type { ReactNode } from 'react';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import type { InfobarContent } from '@/components/ui/infobar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useIsMobile } from '@/hooks/use-mobile';

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
  /**
   * URL param that holds the selected item id (`?review=`, `?question=`). Below 768px the template
   * shows the list, or the detail with a «Назад» bar when the param is set.
   */
  detailParam?: string;
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
  detailParam = 'id',
  access = true
}: InboxPageProps) {
  const t = useTranslations('common');
  const isMobile = useIsMobile();
  const [selected, setSelected] = useQueryState(detailParam, { shallow: true });

  return (
    <PageContainer
      pageTitle={title}
      pageDescription={description}
      infoContent={infoContent}
      pageHeaderAction={actions}
      access={access}
    >
      <div className='flex flex-1 flex-col gap-4' data-template='inbox'>
        {kpi && (
          <div className='-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [&>*]:w-44 [&>*]:shrink-0 [&>*]:snap-start sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 sm:[&>*]:w-auto xl:grid-cols-5'>
            {kpi}
          </div>
        )}
        <div className='relative min-h-[60vh] flex-1'>
          <div className='absolute inset-0 overflow-hidden rounded-lg border'>
            {isMobile ? (
              selected ? (
                <div className='flex h-full flex-col'>
                  <div className='flex items-center gap-2 border-b px-2 py-1.5'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => void setSelected(null)}
                      data-testid='inbox-back'
                    >
                      <Icons.chevronLeft className='size-4' /> {t('back')}
                    </Button>
                  </div>
                  <div className='min-h-0 flex-1'>{detail}</div>
                </div>
              ) : (
                <div className='h-full'>{list}</div>
              )
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
