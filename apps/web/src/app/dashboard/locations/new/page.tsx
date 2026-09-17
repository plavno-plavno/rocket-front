import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DetailPage } from '@/components/lp';
import { LocationForm } from '@/features/locations/components/location-form/location-form';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('locations.form');
  return { title: t('titleNew') };
}

/** S-LOC-03 (create) — owned by UI-F1. */
export default async function NewLocationPage() {
  const [t, access] = await Promise.all([
    getTranslations('locations.form'),
    requireAccess({ permission: 'locations.edit' })
  ]);
  return (
    <DetailPage title={t('titleNew')} access={access}>
      <LocationForm />
    </DetailPage>
  );
}
