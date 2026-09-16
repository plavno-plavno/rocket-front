import { queryOptions } from '@tanstack/react-query';
import { listTags, getTag } from './service';
import type { ListTagsQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const tagsKeys = {
  all: ['tags'] as const,
  tags: (params?: ListTagsQuery) => [...tagsKeys.all, 'tags', params ?? {}] as const,
  tag: (id: string) => [...tagsKeys.all, 'tag', id] as const
};

export const tagsQueryOptions = (params?: ListTagsQuery) =>
  queryOptions({ queryKey: tagsKeys.tags(params), queryFn: () => listTags(params) });

export const tagQueryOptions = (id: string) =>
  queryOptions({ queryKey: tagsKeys.tag(id), queryFn: () => getTag(id) });
