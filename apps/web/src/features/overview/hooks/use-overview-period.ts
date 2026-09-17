'use client';

import { useQueryStates } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { presetRange, type PeriodValue } from '@/components/lp';
import { overviewSearchParams } from '../searchparams';

/** Overview period (30 days by default) shared by both trend widgets; lives in the URL. */
export function useOverviewPeriod() {
  const [params, setParams] = useQueryStates(overviewSearchParams, { shallow: true });
  const fallback = useMemo(() => presetRange('30d'), []);
  const period: PeriodValue = useMemo(
    () => ({
      from: params.from || fallback.from,
      to: params.to || fallback.to,
      granularity: params.granularity,
      compare: null
    }),
    [params.from, params.to, params.granularity, fallback]
  );
  const setPeriod = useCallback(
    (v: PeriodValue) => setParams({ from: v.from, to: v.to, granularity: v.granularity }),
    [setParams]
  );
  return { period, setPeriod, scope: params.scope || 'all' };
}
