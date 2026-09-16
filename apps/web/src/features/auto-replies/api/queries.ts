import { queryOptions } from '@tanstack/react-query';
import { listAutoReplyRules, getAutoReplyRule } from './service';
import type { ListAutoReplyRulesQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const autoRepliesKeys = {
  all: ['auto-replies'] as const,
  autoReplyRules: (params?: ListAutoReplyRulesQuery) =>
    [...autoRepliesKeys.all, 'autoReplyRules', params ?? {}] as const,
  autoReplyRule: (id: string) => [...autoRepliesKeys.all, 'autoReplyRule', id] as const
};

export const autoReplyRulesQueryOptions = (params?: ListAutoReplyRulesQuery) =>
  queryOptions({
    queryKey: autoRepliesKeys.autoReplyRules(params),
    queryFn: () => listAutoReplyRules(params)
  });

export const autoReplyRuleQueryOptions = (id: string) =>
  queryOptions({
    queryKey: autoRepliesKeys.autoReplyRule(id),
    queryFn: () => getAutoReplyRule(id)
  });
