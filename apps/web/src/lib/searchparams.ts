import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral
} from 'nuqs/server';

/**
 * Shared URL-state parsers (SDD-01 §5.1, SDD-01T §2) — isomorphic (server cache + client hooks).
 * Feature-specific parsers live in `features/<f>/searchparams.ts` and spread these.
 * Client hooks: `@/hooks/use-scope`.
 */
export const scopeParser = parseAsString.withDefault('all');

export const commonSearchParams = {
  scope: scopeParser,
  page: parseAsInteger.withDefault(1),
  page_size: parseAsInteger.withDefault(25),
  sort: parseAsString.withDefault(''),
  q: parseAsString.withDefault('')
};

export const periodSearchParams = {
  from: parseAsString.withDefault(''),
  to: parseAsString.withDefault(''),
  granularity: parseAsStringLiteral(['day', 'week', 'month'] as const).withDefault('day'),
  compare_from: parseAsString.withDefault(''),
  compare_to: parseAsString.withDefault('')
};

export const serialize = createSerializer(commonSearchParams);

/** Server-side cache of the shared params (use in `page.tsx`). */
export const searchParamsCache = createSearchParamsCache(commonSearchParams);

/** Splits the `scope` param into group ids (`all` → empty array). */
export function scopeToGroupIds(scope: string): string[] {
  return scope === 'all' || !scope ? [] : scope.split(',').filter(Boolean);
}

export function groupIdsToScope(ids: string[]): string {
  return ids.length ? ids.join(',') : 'all';
}
