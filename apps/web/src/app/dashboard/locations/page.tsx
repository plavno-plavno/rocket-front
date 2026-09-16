import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { SearchParams } from 'nuqs/server';
import { ListPage } from '@/components/lp';
import { LocationHeaderActions } from '@/features/locations/components/location-header-actions';
import { LocationKpis } from '@/features/locations/components/location-kpis';
import { LocationListing } from '@/features/locations/components/location-listing';
import { LocationTabs } from '@/features/locations/components/location-tabs';
import { locationsSearchParamsCache } from '@/features/locations/searchparams';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('locations.list');
  return { title: t('title') };
}

export default async function LocationsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  await locationsSearchParamsCache.parse(searchParams);
  const [t, access] = await Promise.all([
    getTranslations('locations.list'),
    requireAccess({ permission: 'locations.read' })
  ]);

  return (
    <ListPage
      title={t('title')}
      description={t('description')}
      infoContent={{
        title: t('info.title'),
        sections: [{ title: t('info.title'), description: t('info.body') }]
      }}
      actions={<LocationHeaderActions />}
      tabs={<LocationTabs />}
      kpi={<LocationKpis />}
      access={access}
    >
      <LocationListing />
    </ListPage>
  );
}
