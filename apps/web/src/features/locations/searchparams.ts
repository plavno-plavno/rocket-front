import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral
} from 'nuqs/server';
import { scopeParser } from '@/lib/searchparams';

/**
 * URL state of «Мои компании» (S-LOC-01). Keys match the table kit (`page`, `perPage`, `sort`)
 * and the faceted filters (column ids). Shared by the server prefetch and the client table.
 */
export const locationsSearchParams = {
  scope: scopeParser,
  tab: parseAsStringLiteral(['maps', 'navigators'] as const).withDefault('maps'),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(25),
  sort: parseAsString.withDefault(''),
  name: parseAsString.withDefault(''),
  city: parseAsArrayOf(parseAsString, ',').withDefault([]),
  group: parseAsArrayOf(parseAsString, ',').withDefault([]),
  syncStatus: parseAsArrayOf(parseAsString, ',').withDefault([]),
  platform: parseAsArrayOf(parseAsString, ',').withDefault([]),
  status: parseAsArrayOf(parseAsString, ',').withDefault([])
};

export const locationsSearchParamsCache = createSearchParamsCache(locationsSearchParams);

export type LocationsSearchParams = {
  [K in keyof typeof locationsSearchParams]: ReturnType<
    (typeof locationsSearchParams)[K]['parseServerSide']
  >;
};

/** Maps URL state → `GET /locations` query (contract param names). */
export function toLocationListQuery(p: LocationsSearchParams) {
  return {
    scope: p.scope,
    page: p.page,
    page_size: p.perPage,
    sort: fromTableSort(p.sort),
    q: p.name || undefined,
    'filter[city]': p.city.length ? p.city : undefined,
    'filter[group_id]': p.group.length ? p.group : undefined,
    'filter[sync_status]': p.syncStatus.length ? (p.syncStatus as never) : undefined,
    'filter[platform_id]': p.platform.length ? p.platform : undefined,
    'filter[status]': p.status.length ? (p.status as never) : undefined,
    'filter[platform_kind]': p.tab === 'navigators' ? ('navigator' as const) : undefined
  };
}

/** Table kit stores sort as JSON `[{"id":"name","desc":false}]`; the API wants `-name`. */
export function fromTableSort(sort: string): string | undefined {
  if (!sort) return undefined;
  try {
    const parsed = JSON.parse(sort) as { id: string; desc: boolean }[];
    return parsed.map((s) => `${s.desc ? '-' : ''}${s.id}`).join(',') || undefined;
  } catch {
    return undefined;
  }
}
