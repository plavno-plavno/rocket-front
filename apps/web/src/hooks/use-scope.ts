'use client';

import { useQueryState, useQueryStates } from 'nuqs';
import { commonSearchParams, scopeParser } from '@/lib/searchparams';

/** Global location scope `?scope=all|grp_…[,grp_…]` — include in every scoped query key. */
export function useScope() {
  return useQueryState('scope', scopeParser.withOptions({ shallow: true, history: 'push' }));
}

export function useCommonSearchParams() {
  return useQueryStates(commonSearchParams, { shallow: true });
}
