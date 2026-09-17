'use client';

import { useQueryStates } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { presetRange, type PeriodValue } from '@/components/lp';
import { reviewAnalyticsSearchParams } from '../searchparams';

export interface AnalyticsFilters {
  region: string;
  brand: string;
  city: string;
  platform: string[];
}

/** Query params shared by every `/analytics/reviews/*` endpoint (SDD-00 review-analytics tag). */
export interface AnalyticsQuery {
  scope: string;
  from: string;
  to: string;
  'filter[region]'?: string;
  'filter[brand_group_id]'?: string;
  'filter[city]'?: string;
  'filter[platform_id]'?: string[];
}

/**
 * Period (30 days by default), inline filters and the resulting core-api query — all in the URL
 * so links to a filtered panel are shareable (SDD-01 §5.4).
 */
export function useAnalyticsParams() {
  const [params, setParams] = useQueryStates(reviewAnalyticsSearchParams, { shallow: true });
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
  const filters: AnalyticsFilters = useMemo(
    () => ({
      region: params.region,
      brand: params.brand,
      city: params.city,
      platform: params.platform
    }),
    [params.region, params.brand, params.city, params.platform]
  );
  const setFilters = useCallback(
    (patch: Partial<AnalyticsFilters>) => setParams({ ...patch, page: 1 }),
    [setParams]
  );
  const query: AnalyticsQuery = useMemo(
    () => ({
      scope: params.scope || 'all',
      from: period.from,
      to: period.to,
      ...(filters.region ? { 'filter[region]': filters.region } : {}),
      ...(filters.brand ? { 'filter[brand_group_id]': filters.brand } : {}),
      ...(filters.city ? { 'filter[city]': filters.city } : {}),
      ...(filters.platform.length ? { 'filter[platform_id]': filters.platform } : {})
    }),
    [params.scope, period.from, period.to, filters]
  );
  const compareQuery = useMemo(
    () =>
      period.compare ? { compare_from: period.compare.from, compare_to: period.compare.to } : {},
    [period.compare]
  );
  return { params, setParams, period, setPeriod, filters, setFilters, query, compareQuery };
}
