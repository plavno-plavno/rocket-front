import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the templates screens — spreads the shared parsers (scope, page, sort, q). */
export const templatesSearchParams = { ...commonSearchParams };

export const templatesSearchParamsCache = createSearchParamsCache(templatesSearchParams);
