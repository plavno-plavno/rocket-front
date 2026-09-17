import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams, periodSearchParams } from '@/lib/searchparams';

/** URL state of the overview: shared parsers (scope, …) + period (`from`, `to`, `granularity`). */
export const overviewSearchParams = { ...commonSearchParams, ...periodSearchParams };

export const overviewSearchParamsCache = createSearchParamsCache(overviewSearchParams);
