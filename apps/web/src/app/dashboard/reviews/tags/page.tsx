import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ListPage } from '@/components/lp';
import { requireAccess } from '@/features/session/server';
import { TagsManager } from '@/features/tags/components/tags-manager';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('tags.page');
  return { title: t('title') };
}

/** S-REV-03 «Теги» — owned by UI-F3. */
export default async function TagsPage() {
  const [t, access] = await Promise.all([
    getTranslations('tags.page'),
    requireAccess({ permission: 'reviews.read' })
  ]);
  return (
    <ListPage
      title={t('title')}
      description={t('description')}
      infoContent={{
        title: t('info.title'),
        sections: [{ title: t('info.title'), description: t('info.body') }]
      }}
      access={access}
    >
      <TagsManager />
    </ListPage>
  );
}
