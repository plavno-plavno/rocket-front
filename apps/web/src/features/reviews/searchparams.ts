import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral
} from 'nuqs/server';
import { scopeParser } from '@/lib/searchparams';
import type { ListReviewsQuery } from './api/types';

export const WORKFLOW_STATUSES = [
  'new',
  'in_progress',
  'resolved',
  'no_reply_needed',
  'escalated'
] as const;
export const PLATFORM_STATES = [
  'visible',
  'edited',
  'deleted_by_author',
  'removed_by_platform'
] as const;
export const RATINGS = ['1', '2', '3', '4', '5', 'none'] as const;
export const SENTIMENTS = ['positive', 'neutral', 'negative'] as const;
export const SORTS = ['-published_at', 'published_at', '-rating', 'rating'] as const;

const strings = parseAsArrayOf(parseAsString).withDefault([]);

/** URL state of the inbox (SDD-01 §8 S-REV-01): every filter is shareable. */
export const reviewsSearchParams = {
  scope: scopeParser,
  review: parseAsString.withDefault(''),
  q: parseAsString.withDefault(''),
  sort: parseAsStringLiteral(SORTS).withDefault('-published_at'),
  platform: strings,
  rating: parseAsArrayOf(parseAsStringLiteral(RATINGS)).withDefault([]),
  from: parseAsString.withDefault(''),
  to: parseAsString.withDefault(''),
  assignee: strings,
  repliedBy: strings,
  hasReply: parseAsBoolean,
  status: parseAsArrayOf(parseAsStringLiteral(WORKFLOW_STATUSES)).withDefault([]),
  tag: strings,
  hasText: parseAsBoolean,
  state: parseAsArrayOf(parseAsStringLiteral(PLATFORM_STATES)).withDefault([]),
  sentiment: parseAsArrayOf(parseAsStringLiteral(SENTIMENTS)).withDefault([]),
  location: strings
};

export type ReviewsSearchParams = {
  [K in keyof typeof reviewsSearchParams]: NonNullable<
    ReturnType<(typeof reviewsSearchParams)[K]['parseServerSide']>
  > | null;
};

export const reviewsSearchParamsCache = createSearchParamsCache(reviewsSearchParams);

/** Keys that count as «filters» for the «Очистить фильтр» button and the badge counter. */
export const FILTER_KEYS = [
  'platform',
  'rating',
  'from',
  'to',
  'assignee',
  'repliedBy',
  'hasReply',
  'status',
  'tag',
  'hasText',
  'state',
  'sentiment',
  'location'
] as const;

export function countActiveFilters(p: ReviewsSearchParams): number {
  return FILTER_KEYS.filter((k) => {
    const v = p[k];
    return Array.isArray(v) ? v.length > 0 : v !== '' && v !== null && v !== undefined;
  }).length;
}

/** nuqs state → `GET /reviews` query (cursor is added by the infinite query). */
const arr = <T>(v: T[] | null | undefined) => (v && v.length ? v : undefined);

export function toReviewsQuery(p: ReviewsSearchParams): ListReviewsQuery {
  return {
    scope: p.scope ?? 'all',
    sort: p.sort ?? '-published_at',
    q: p.q || undefined,
    'filter[platform_id]': arr(p.platform),
    'filter[rating]': arr(p.rating),
    'filter[from]': p.from || undefined,
    'filter[to]': p.to || undefined,
    'filter[assignee_user_id]': arr(p.assignee),
    'filter[replied_by_user_id]': arr(p.repliedBy),
    'filter[has_reply]': p.hasReply ?? undefined,
    'filter[workflow_status]': arr(p.status),
    'filter[tag_id]': arr(p.tag),
    'filter[has_text]': p.hasText ?? undefined,
    'filter[platform_state]': arr(p.state),
    'filter[sentiment]': arr(p.sentiment),
    'filter[location_id]': arr(p.location)
  };
}
