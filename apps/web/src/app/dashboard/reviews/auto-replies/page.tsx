import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ListPage } from '@/components/lp';
import { RulesHeaderActions, RulesTable } from '@/features/auto-replies/components/rules-table';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auto-replies.page');
  return { title: t('title') };
}

/** S-REV-04 «Автоответы» — owned by UI-F3. */
export default async function AutoRepliesPage() {
  const [t, access] = await Promise.all([
    getTranslations('auto-replies.page'),
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
      actions={<RulesHeaderActions />}
      access={access}
    >
      <RulesTable />
    </ListPage>
  );
}
