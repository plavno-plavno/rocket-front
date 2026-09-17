import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { OnboardingWizard } from '@/features/onboarding/components/onboarding-wizard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('onboarding.page');
  return { title: t('title') };
}

/** S-ONB-01 «Онбординг» — owned by UI-F7 (renders `WizardPage`). */
export default function Page() {
  return (
    <Suspense fallback={<Skeleton className='m-4 h-96' />}>
      <OnboardingWizard />
    </Suspense>
  );
}
