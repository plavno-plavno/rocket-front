import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PresenceActions, PresenceScreen } from '@/features/presence/components/presence-overview';
import { PresencePlatform } from '@/features/presence/components/presence-platform';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('presence.screens');
  return { title: t('platform.title') };
}

/** S-PRS-01 `platform/[platformId]` — owned by UI-F4 (renders `AnalyticsPage` via PresenceScreen). */
export default async function Page({ params }: { params: Promise<{ platformId: string }> }) {
  const [{ platformId }, access] = await Promise.all([
    params,
    requireAccess({ permission: 'analytics.read' })
  ]);
  return (
    <PresenceScreen screen='platform' access={access} actions={<PresenceActions withCompare />}>
      <PresencePlatform platformId={platformId} />
    </PresenceScreen>
  );
}
