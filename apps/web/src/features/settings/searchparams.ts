import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the settings screens — spreads the shared parsers (scope, page, sort, q). */
export const settingsSearchParams = { ...commonSearchParams };

export const settingsSearchParamsCache = createSearchParamsCache(settingsSearchParams);
