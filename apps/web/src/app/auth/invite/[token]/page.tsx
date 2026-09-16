import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { InviteForm } from '@/features/session/components/invite-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('session.invite');
  return { title: t('title', { tenant: '' }).trim() };
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InviteForm token={token} />;
}
