import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral
} from 'nuqs/server';
import { scopeParser } from '@/lib/searchparams';
import type { ListQuestionsQuery } from './api/types';

export const QUESTION_STATUSES = [
  'new',
  'in_progress',
  'resolved',
  'no_reply_needed',
  'escalated'
] as const;

/** URL state of the questions inbox (S-QA-01). */
export const questionsSearchParams = {
  scope: scopeParser,
  question: parseAsString.withDefault(''),
  q: parseAsString.withDefault(''),
  platform: parseAsArrayOf(parseAsString).withDefault([]),
  status: parseAsArrayOf(parseAsStringLiteral(QUESTION_STATUSES)).withDefault([]),
  hasAnswer: parseAsBoolean
};

export type QuestionsSearchParams = {
  [K in keyof typeof questionsSearchParams]: NonNullable<
    ReturnType<(typeof questionsSearchParams)[K]['parseServerSide']>
  > | null;
};

export const questionsSearchParamsCache = createSearchParamsCache(questionsSearchParams);

export function toQuestionsQuery(p: QuestionsSearchParams): ListQuestionsQuery {
  return {
    scope: p.scope ?? 'all',
    q: p.q || undefined,
    'filter[platform_id]': p.platform?.length ? p.platform : undefined,
    'filter[workflow_status]': p.status?.length ? p.status : undefined,
    'filter[has_answer]': p.hasAnswer ?? undefined
  };
}
