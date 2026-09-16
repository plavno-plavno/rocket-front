import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ResetRequestForm } from '@/features/session/components/reset-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('session.reset');
  return { title: t('title') };
}

export default function ResetPage() {
  return <ResetRequestForm />;
}
