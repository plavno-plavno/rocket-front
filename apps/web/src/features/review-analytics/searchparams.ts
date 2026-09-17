import { createSearchParamsCache } from 'nuqs/server';
import { parseAsArrayOf, parseAsString } from 'nuqs';
import { commonSearchParams, periodSearchParams } from '@/lib/searchparams';

/** URL state of the review-analytics screens: shared parsers + period + inline filters (region / brand / city / platform). */
export const reviewAnalyticsSearchParams = {
  ...commonSearchParams,
  ...periodSearchParams,
  region: parseAsString.withDefault(''),
  brand: parseAsString.withDefault(''),
  city: parseAsString.withDefault(''),
  platform: parseAsArrayOf(parseAsString).withDefault([]),
  keyword: parseAsString.withDefault('')
};

export const reviewAnalyticsSearchParamsCache = createSearchParamsCache(
  reviewAnalyticsSearchParams
);
