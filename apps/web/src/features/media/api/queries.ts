import { queryOptions } from '@tanstack/react-query';
import { listMediaAssets, listListingMedia } from './service';
import type { ListMediaAssetsQuery, ListListingMediaQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const mediaKeys = {
  all: ['media'] as const,
  mediaAssets: (params?: ListMediaAssetsQuery) =>
    [...mediaKeys.all, 'mediaAssets', params?.scope ?? 'all', params ?? {}] as const,
  listingMedia: (params?: ListListingMediaQuery) =>
    [...mediaKeys.all, 'listingMedia', params?.scope ?? 'all', params ?? {}] as const
};

export const mediaAssetsQueryOptions = (params?: ListMediaAssetsQuery) =>
  queryOptions({ queryKey: mediaKeys.mediaAssets(params), queryFn: () => listMediaAssets(params) });

export const listingMediaQueryOptions = (params?: ListListingMediaQuery) =>
  queryOptions({
    queryKey: mediaKeys.listingMedia(params),
    queryFn: () => listListingMedia(params)
  });
