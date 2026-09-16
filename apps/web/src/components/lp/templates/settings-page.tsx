import type { ReactNode } from 'react';
import PageContainer from '@/components/layout/page-container';
import type { InfobarContent } from '@/components/ui/infobar';

export interface SettingsPageProps {
  title: string;
  description?: string;
  infoContent?: InfobarContent;
  actions?: ReactNode;
  /** Nested settings navigation (rendered by the settings feature). */
  nav?: ReactNode;
  children: ReactNode;
  access?: boolean;
}

/** Settings template (SDD-01T §3.6): nested nav + form column (max ~ 800px). */
export function SettingsPage({
  title,
  description,
  infoContent,
  actions,
  nav,
  children,
  access = true
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
        <div className='flex max-w-3xl flex-1 flex-col gap-6'>{children}</div>
      </div>
    </PageContainer>
  );
}
