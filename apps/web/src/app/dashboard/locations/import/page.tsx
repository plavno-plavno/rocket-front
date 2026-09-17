import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PageContainer from '@/components/layout/page-container';
import { ImportWizard } from '@/features/locations/components/location-import/import-wizard';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('locations.import');
  return { title: t('title') };
}

/** S-LOC-02 — owned by UI-F1. */
export default async function ImportPage() {
  const access = await requireAccess({ permission: 'locations.edit' });
  if (!access)
    return (
      <PageContainer access={false}>
        <span />
      </PageContainer>
    );
  return <ImportWizard />;
}
