import { queryOptions } from '@tanstack/react-query';
import { listConversations, getConversation, listConversationMessages } from './service';
import type { ListConversationsQuery, ListConversationMessagesQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const communicationKeys = {
  all: ['communication'] as const,
  conversations: (params?: ListConversationsQuery) =>
    [...communicationKeys.all, 'conversations', params?.scope ?? 'all', params ?? {}] as const,
  conversation: (id: string) => [...communicationKeys.all, 'conversation', id] as const,
  conversationMessages: (id: string, params?: ListConversationMessagesQuery) =>
    [...communicationKeys.all, 'conversationMessages', id, params ?? {}] as const
};

export const conversationsQueryOptions = (params?: ListConversationsQuery) =>
  queryOptions({
    queryKey: communicationKeys.conversations(params),
    queryFn: () => listConversations(params)
  });

export const conversationQueryOptions = (id: string) =>
  queryOptions({
    queryKey: communicationKeys.conversation(id),
    queryFn: () => getConversation(id)
  });

export const conversationMessagesQueryOptions = (
  id: string,
  params?: ListConversationMessagesQuery
) =>
  queryOptions({
    queryKey: communicationKeys.conversationMessages(id, params),
    queryFn: () => listConversationMessages(id, params)
  });
