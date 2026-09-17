'use client';

import { useQueryStates } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { presetRange, type PeriodValue } from '@/components/lp';
import { presenceSearchParams } from '../searchparams';

/** Period (30 days by default) + platform filter of the presence screens, kept in the URL. */
export function usePresenceParams() {
  const [params, setParams] = useQueryStates(presenceSearchParams, { shallow: true });
  const fallback = useMemo(() => presetRange('30d'), []);
  const period: PeriodValue = useMemo(
    () => ({
      from: params.from || fallback.from,
      to: params.to || fallback.to,
      granularity: params.granularity,
      compare:
        params.compare_from && params.compare_to
          ? { from: params.compare_from, to: params.compare_to }
          : null
    }),
    [params.from, params.to, params.granularity, params.compare_from, params.compare_to, fallback]
  );
  const setPeriod = useCallback(
    (v: PeriodValue) =>
      setParams({
        from: v.from,
        to: v.to,
        granularity: v.granularity,
        compare_from: v.compare?.from ?? '',
        compare_to: v.compare?.to ?? '',
        page: 1
      }),
    [setParams]
  );
  const query = useMemo(
    () => ({
      scope: params.scope || 'all',
      from: period.from,
      to: period.to,
      ...(params.platform.length ? { 'filter[platform_id]': params.platform } : {})
    }),
    [params.scope, params.platform, period.from, period.to]
  );
  const compareQuery = useMemo(
    () =>
      period.compare ? { compare_from: period.compare.from, compare_to: period.compare.to } : {},
    [period.compare]
  );
  return { params, setParams, period, setPeriod, query, compareQuery };
}
