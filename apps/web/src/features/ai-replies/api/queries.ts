import { queryOptions } from '@tanstack/react-query';
import { listAiReplyProfiles, getAiReplyProfile } from './service';
import type { ListAiReplyProfilesQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const aiRepliesKeys = {
  all: ['ai-replies'] as const,
  aiReplyProfiles: (params?: ListAiReplyProfilesQuery) =>
    [...aiRepliesKeys.all, 'aiReplyProfiles', params ?? {}] as const,
  aiReplyProfile: (id: string) => [...aiRepliesKeys.all, 'aiReplyProfile', id] as const
};

export const aiReplyProfilesQueryOptions = (params?: ListAiReplyProfilesQuery) =>
  queryOptions({
    queryKey: aiRepliesKeys.aiReplyProfiles(params),
    queryFn: () => listAiReplyProfiles(params)
  });

export const aiReplyProfileQueryOptions = (id: string) =>
  queryOptions({
    queryKey: aiRepliesKeys.aiReplyProfile(id),
    queryFn: () => getAiReplyProfile(id)
  });
