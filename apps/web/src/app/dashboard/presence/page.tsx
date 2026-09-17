import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  PresenceActions,
  PresenceKpis,
  PresenceOverview,
  PresenceScreen
} from '@/features/presence/components/presence-overview';
import { requireAccess } from '@/features/session/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('presence.screens');
  return { title: t('overview.title') };
}

/** S-PRS-01 — owned by UI-F4 (renders `AnalyticsPage` via PresenceScreen). */
export default async function Page() {
  const access = await requireAccess({ permission: 'analytics.read' });
  return (
    <PresenceScreen
      screen='overview'
      access={access}
      actions={<PresenceActions />}
      kpi={<PresenceKpis />}
    >
      <PresenceOverview />
    </PresenceScreen>
  );
}
