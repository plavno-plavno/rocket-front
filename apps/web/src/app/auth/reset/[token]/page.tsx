import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ResetConfirmForm } from '@/features/session/components/reset-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('session.reset');
  return { title: t('newPasswordTitle') };
}

export default async function ResetConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ResetConfirmForm token={token} />;
}
