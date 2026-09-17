import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { SearchParams } from 'nuqs/server';
import { InboxPage } from '@/components/lp';
import {
  QuestionDetail,
  QuestionsFiltersPanel,
  QuestionsFiltersSheet,
  QuestionsList
} from '@/features/questions/components/questions-inbox';
import { questionsSearchParamsCache } from '@/features/questions/searchparams';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('questions.page');
  return { title: t('title') };
}

/** S-QA-01 «Вопросы и ответы» — owned by UI-F2. */
export default async function QuestionsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await questionsSearchParamsCache.parse(searchParams);
  const [t, access] = await Promise.all([
    getTranslations('questions.page'),
    requireAccess({ permission: 'reviews.read' })
  ]);
  return (
    <InboxPage
      title={t('title')}
      description={t('description')}
      infoContent={{
        title: t('info.title'),
        sections: [{ title: t('info.title'), description: t('info.body') }]
      }}
      actions={<QuestionsFiltersSheet />}
      list={<QuestionsList />}
      detail={<QuestionDetail />}
      filters={<QuestionsFiltersPanel />}
      detailParam='question'
      access={access}
    />
  );
}
