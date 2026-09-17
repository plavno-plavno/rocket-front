import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsPage } from '@/components/lp';
import { requireAccess } from '@/features/session/server';
import { SettingsNav } from '@/features/settings/components/settings-nav';
import { NotificationSettingsForm } from '@/features/settings/components/notification-settings';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings.notifications');
  return { title: t('pageTitle') };
}

/** S-SET-04 — owned by UI-F7. */
export default async function Page() {
  const [t, access] = await Promise.all([
    getTranslations('settings.notifications'),
    requireAccess()
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
      <NotificationSettingsForm />
    </SettingsPage>
  );
}
