import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsPage } from '@/components/lp';
import { requireAccess } from '@/features/session/server';
import { SettingsNav } from '@/features/settings/components/settings-nav';
import { SourcesSettings } from '@/features/settings/components/sources-settings';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings.sources');
  return { title: t('pageTitle') };
}

/** S-SET-06 — owned by UI-F7. */
export default async function Page() {
  const [t, access] = await Promise.all([
    getTranslations('settings.sources'),
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
    >
      <SourcesSettings />
    </SettingsPage>
  );
}
