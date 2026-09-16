import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the products screens — spreads the shared parsers (scope, page, sort, q). */
export const productsSearchParams = { ...commonSearchParams };

export const productsSearchParamsCache = createSearchParamsCache(productsSearchParams);
