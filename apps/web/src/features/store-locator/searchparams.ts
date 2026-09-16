import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the store-locator screens — spreads the shared parsers (scope, page, sort, q). */
export const storeLocatorSearchParams = { ...commonSearchParams };

export const storeLocatorSearchParamsCache = createSearchParamsCache(storeLocatorSearchParams);
