import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsPage } from '@/components/lp';
import { AiPageBody } from '@/features/ai-replies/components/ai-page';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ai-replies.page');
  return { title: t('title') };
}

/** S-REV-05 «Нейросеть» — owned by UI-F3. */
export default async function AiPage() {
  const [t, access] = await Promise.all([
    getTranslations('ai-replies.page'),
    requireAccess({ permission: 'reviews.read' })
  ]);
  return (
    <SettingsPage
      title={t('title')}
      description={t('description')}
      infoContent={{
        title: t('info.title'),
        sections: [{ title: t('info.title'), description: t('info.body') }]
      }}
      access={access}
      wide
    >
      <AiPageBody />
    </SettingsPage>
  );
}
