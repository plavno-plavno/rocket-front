import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the publications screens — spreads the shared parsers (scope, page, sort, q). */
export const publicationsSearchParams = { ...commonSearchParams };

export const publicationsSearchParamsCache = createSearchParamsCache(publicationsSearchParams);
