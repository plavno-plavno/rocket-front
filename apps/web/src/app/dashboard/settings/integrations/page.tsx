import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsPage } from '@/components/lp';
import { requireAccess } from '@/features/session/server';
import { SettingsNav } from '@/features/settings/components/settings-nav';
import { IntegrationsSettings } from '@/features/settings/components/integrations-settings';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings.integrations');
  return { title: t('pageTitle') };
}

/** S-SET-05 — owned by UI-F7. */
export default async function Page() {
  const [t, access] = await Promise.all([
    getTranslations('settings.integrations'),
    requireAccess({ permission: 'integrations.manage' })
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
      <IntegrationsSettings />
    </SettingsPage>
  );
}
