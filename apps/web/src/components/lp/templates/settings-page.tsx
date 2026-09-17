import type { ReactNode } from 'react';
import PageContainer from '@/components/layout/page-container';
import type { InfobarContent } from '@/components/ui/infobar';
import { cn } from '@/lib/utils';

export interface SettingsPageProps {
  title: string;
  description?: string;
  infoContent?: InfobarContent;
  actions?: ReactNode;
  /** Nested settings navigation (rendered by the settings feature). */
  nav?: ReactNode;
  children: ReactNode;
  access?: boolean;
  /** Table-heavy screens (users, accounts, integrations) use the full width instead of ~800px. */
  wide?: boolean;
}

/** Settings template (SDD-01T §3.6): nested nav + form column (max ~ 800px). */
export function SettingsPage({
  title,
  description,
  infoContent,
  actions,
  nav,
  children,
  access = true,
  wide = false
}: SettingsPageProps) {
  return (
    <PageContainer
      pageTitle={title}
      pageDescription={description}
      infoContent={infoContent}
      pageHeaderAction={actions}
      access={access}
    >
      <div className='flex flex-1 flex-col gap-6 lg:flex-row' data-template='settings'>
        {nav && <nav className='w-full shrink-0 lg:w-56'>{nav}</nav>}
        <div className={cn('flex min-w-0 flex-1 flex-col gap-6', !wide && 'max-w-3xl')}>
          {children}
        </div>
      </div>
    </PageContainer>
  );
}
