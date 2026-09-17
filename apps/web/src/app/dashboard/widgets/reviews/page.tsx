import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ListPage } from '@/components/lp';
import { requireAccess } from '@/features/session/server';
import { ReviewsWidget } from '@/features/widgets/components/reviews-widget';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('widgets.page');
  return { title: t('title') };
}

/** S-WID-01 «Виджет с отзывами» — owned by UI-F6. */
export default async function Page() {
  const [t, access] = await Promise.all([
    getTranslations('widgets.page'),
    requireAccess({ feature: 'widgets' })
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
      <ReviewsWidget />
    </ListPage>
  );
}
