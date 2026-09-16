import { queryOptions } from '@tanstack/react-query';
import { listPublications, getPublication } from './service';
import type { ListPublicationsQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const publicationsKeys = {
  all: ['publications'] as const,
  publications: (params?: ListPublicationsQuery) =>
    [...publicationsKeys.all, 'publications', params?.scope ?? 'all', params ?? {}] as const,
  publication: (id: string) => [...publicationsKeys.all, 'publication', id] as const
};

export const publicationsQueryOptions = (params?: ListPublicationsQuery) =>
  queryOptions({
    queryKey: publicationsKeys.publications(params),
    queryFn: () => listPublications(params)
  });

export const publicationQueryOptions = (id: string) =>
  queryOptions({ queryKey: publicationsKeys.publication(id), queryFn: () => getPublication(id) });
