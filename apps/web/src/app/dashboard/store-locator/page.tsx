import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ListPage } from '@/components/lp';
import { requireAccess } from '@/features/session/server';
import { StoreLocator } from '@/features/store-locator/components/store-locator';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('store-locator.page');
  return { title: t('title') };
}

/** «Сторлокатор» (Beta) — owned by UI-F6. */
export default async function Page() {
  const [t, access] = await Promise.all([
    getTranslations('store-locator.page'),
    requireAccess({ feature: 'store_locator' })
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
      <StoreLocator />
    </ListPage>
  );
}
