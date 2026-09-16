import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SignInForm } from '@/features/session/components/sign-in-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('session.signIn');
  return { title: t('title') };
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
