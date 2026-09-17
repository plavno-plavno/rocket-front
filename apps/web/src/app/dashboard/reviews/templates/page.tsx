import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ListPage } from '@/components/lp';
import { requireAccess } from '@/features/session/server';
import {
  TemplatesHeaderActions,
  TemplatesTable
} from '@/features/templates/components/manage/templates-table';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('templates.page');
  return { title: t('title') };
}

/** S-REV-02 «Шаблоны ответов» — owned by UI-F3. */
export default async function TemplatesPage() {
  const [t, access] = await Promise.all([
    getTranslations('templates.page'),
    requireAccess({ permission: 'templates.private' })
  ]);
  return (
    <ListPage
      title={t('title')}
      description={t('description')}
      infoContent={{
        title: t('info.title'),
        sections: [{ title: t('info.title'), description: t('info.body') }]
      }}
      actions={<TemplatesHeaderActions />}
      access={access}
    >
      <TemplatesTable />
    </ListPage>
  );
}
