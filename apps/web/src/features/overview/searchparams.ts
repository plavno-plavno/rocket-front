import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the overview screens — spreads the shared parsers (scope, page, sort, q). */
export const overviewSearchParams = { ...commonSearchParams };

export const overviewSearchParamsCache = createSearchParamsCache(overviewSearchParams);
