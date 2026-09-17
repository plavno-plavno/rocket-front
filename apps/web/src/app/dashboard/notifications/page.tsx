import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import NotificationsPage from '@/features/notifications/components/notifications-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notifications.page');
  return { title: t('title') };
}

/** S-NOT-01 «Уведомления» — owned by UI-F7. */
export default function Page() {
  return <NotificationsPage />;
}
