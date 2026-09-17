import React from 'react';
import { useTranslations } from 'next-intl';
import { Heading } from '../ui/heading';
import type { InfobarContent } from '@/components/ui/infobar';

function PageSkeleton() {
  const t = useTranslations('common');
  return (
    <div
      role='status'
      aria-label={t('loading')}
      className='flex flex-1 animate-pulse flex-col gap-4 p-4 md:px-6'
    >
      <div className='flex items-center justify-between'>
        <div>
          <div className='bg-muted mb-2 h-8 w-48 rounded' />
          <div className='bg-muted h-4 w-full max-w-96 rounded' />
        </div>
      </div>
      <div className='bg-muted mt-6 h-40 w-full rounded-lg' />
      <div className='bg-muted h-40 w-full rounded-lg' />
    </div>
  );
}

function NoAccess() {
  const t = useTranslations('common');
  return <div className='text-muted-foreground text-center text-lg'>{t('noAccess')}</div>;
}

export default function PageContainer({
  children,
  isLoading = false,
  access = true,
  accessFallback,
  pageTitle,
  pageDescription,
  infoContent,
  pageHeaderAction
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  access?: boolean;
  accessFallback?: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  infoContent?: InfobarContent;
  pageHeaderAction?: React.ReactNode;
}) {
  if (!access) {
    return (
      <div role='status' className='flex flex-1 items-center justify-center p-4 md:px-6'>
        {accessFallback ?? <NoAccess />}
      </div>
    );
  }

  const content = isLoading ? <PageSkeleton /> : children;

  const hasHeader = pageTitle || pageHeaderAction;

  return (
    <div className='lp-page flex w-full min-w-0 flex-1 flex-col px-4 pt-5 pb-8 md:px-7 md:pt-6'>
      {hasHeader && (
        <div data-motion className='lp-page-heading mb-6 flex flex-col items-start gap-4'>
          <Heading
            title={pageTitle ?? ''}
            description={pageDescription ?? ''}
            infoContent={infoContent}
          />
          {/* One rule on every page: actions sit right under the title, on the left edge. */}
          {pageHeaderAction && <div className='max-w-full min-w-0'>{pageHeaderAction}</div>}
        </div>
      )}
      {content}
    </div>
  );
}
