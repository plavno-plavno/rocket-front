'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useQueryStates } from 'nuqs';
import { StatusStatCard } from '@/components/lp';
import { listingsSummaryQueryOptions } from '../api/queries';
import { locationsSearchParams } from '../searchparams';

const CARDS = [
  { key: 'synced', icon: 'circleCheck', tone: 'text-status-synced' },
  { key: 'sent', icon: 'send', tone: 'text-status-sent' },
  { key: 'action_required', icon: 'warning', tone: 'text-status-action' }
] as const;

/** 3 StatusStatCards by listings (SCR-1); click toggles the `syncStatus` faceted filter. */
export function LocationKpis() {
  const t = useTranslations('locations.list.kpi');
  const [params, setParams] = useQueryStates(locationsSearchParams, { shallow: true });
  const { data, isPending } = useQuery(
    listingsSummaryQueryOptions(params.scope, params.tab === 'navigators' ? 'navigator' : undefined)
  );
  const counts = data?.counts;

  return (
    <>
      {CARDS.map((card) => {
        const active = params.syncStatus.length === 1 && params.syncStatus[0] === card.key;
        return (
          <StatusStatCard
            key={card.key}
            title={t(card.key)}
            value={counts?.[card.key]}
            total={counts?.total}
            ofLabel={counts ? t('ofTotal', { total: counts.total }) : undefined}
            icon={card.icon}
            tone={card.tone}
            loading={isPending}
            active={active}
            onClick={() => void setParams({ syncStatus: active ? [] : [card.key], page: 1 })}
          />
        );
      })}
    </>
  );
}
