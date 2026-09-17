import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsPage } from '@/components/lp';
import { requireAccess } from '@/features/session/server';
import { SettingsNav } from '@/features/settings';
import { UsersTable } from '@/features/users/components/users-table';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('users.page');
  return { title: t('title') };
}

/** S-SET-01 «Пользователи» — owned by UI-F7. */
export default async function Page() {
  const [t, access] = await Promise.all([
    getTranslations('users.page'),
    requireAccess({ permission: 'users.manage' })
  ]);
  return (
    <SettingsPage
      title={t('title')}
      description={t('description')}
      infoContent={{
        title: t('info.title'),
        sections: [{ title: t('info.title'), description: t('info.body') }]
      }}
      nav={<SettingsNav />}
      access={access}
      wide
    >
      <UsersTable />
    </SettingsPage>
  );
}
