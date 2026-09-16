import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TwoFactorForm } from '@/features/session/components/two-factor-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('session.twoFactor');
  return { title: t('title') };
}

export default function TwoFactorPage() {
  return (
    <Suspense>
      <TwoFactorForm />
    </Suspense>
  );
}
