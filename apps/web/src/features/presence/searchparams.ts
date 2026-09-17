import { createSearchParamsCache } from 'nuqs/server';
import { parseAsArrayOf, parseAsString } from 'nuqs';
import { commonSearchParams, periodSearchParams } from '@/lib/searchparams';

/** URL state of the presence screens: shared parsers + period + platform filter + keywords month. */
export const presenceSearchParams = {
  ...commonSearchParams,
  ...periodSearchParams,
  platform: parseAsArrayOf(parseAsString).withDefault([]),
  month: parseAsString.withDefault('')
};

export const presenceSearchParamsCache = createSearchParamsCache(presenceSearchParams);
