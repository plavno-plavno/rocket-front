import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsPage } from '@/components/lp';
import { requireAccess } from '@/features/session/server';
import { SettingsNav } from '@/features/settings/components/settings-nav';
import { AccountsSettings } from '@/features/settings/components/accounts-settings';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings.accounts');
  return { title: t('pageTitle') };
}

/** S-SET-03 — owned by UI-F7. */
export default async function Page() {
  const [t, access] = await Promise.all([
    getTranslations('settings.accounts'),
    requireAccess({ permission: 'accounts.manage' })
  ]);
  return (
    <SettingsPage
      title={t('pageTitle')}
      description={t('pageDescription')}
      infoContent={{
        title: t('info.title'),
        sections: [{ title: t('info.title'), description: t('info.body') }]
      }}
      nav={<SettingsNav />}
      access={access}
      wide
    >
      <Suspense fallback={<Skeleton className='h-64' />}>
        <AccountsSettings />
      </Suspense>
    </SettingsPage>
  );
}
