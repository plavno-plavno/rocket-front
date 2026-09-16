import { createSearchParamsCache } from 'nuqs/server';
import { commonSearchParams } from '@/lib/searchparams';

/** URL state of the widgets screens — spreads the shared parsers (scope, page, sort, q). */
export const widgetsSearchParams = { ...commonSearchParams };

export const widgetsSearchParamsCache = createSearchParamsCache(widgetsSearchParams);
