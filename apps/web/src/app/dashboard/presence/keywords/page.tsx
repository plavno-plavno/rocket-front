import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PresenceKeywords } from '@/features/presence/components/presence-keywords';
import { PresenceScreen } from '@/features/presence/components/presence-overview';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('presence.screens');
  return { title: t('keywords.title') };
}

/** S-PRS-01 `keywords` — owned by UI-F4 (renders `AnalyticsPage` via PresenceScreen). */
export default async function Page() {
  const access = await requireAccess({ permission: 'analytics.read' });
  return (
    <PresenceScreen screen='keywords' access={access}>
      <PresenceKeywords />
    </PresenceScreen>
  );
}
