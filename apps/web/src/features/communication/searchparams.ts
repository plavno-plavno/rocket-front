import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the communication screens — spreads the shared parsers (scope, page, sort, q). */
export const communicationSearchParams = { ...commonSearchParams };

export const communicationSearchParamsCache = createSearchParamsCache(communicationSearchParams);
