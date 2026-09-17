import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PresenceScreen } from '@/features/presence/components/presence-overview';
import { PresenceSync } from '@/features/presence/components/presence-sync';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('presence.screens');
  return { title: t('sync.title') };
}

/** S-PRS-01 `sync` — owned by UI-F4 (renders `AnalyticsPage` via PresenceScreen). */
export default async function Page() {
  const access = await requireAccess({ permission: 'analytics.read' });
  return (
    <PresenceScreen screen='sync' access={access}>
      <PresenceSync />
    </PresenceScreen>
  );
}
