import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { aiRepliesKeys } from './queries';
import {
  createAiReplyProfile,
  updateAiReplyProfile,
  deleteAiReplyProfile,
  generateAiReply
} from './service';

export const createAiReplyProfileMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...aiRepliesKeys.all, 'create_ai_reply_profile'],
    mutationFn: ({ body }: { body: Parameters<typeof createAiReplyProfile>[0] }) =>
      createAiReplyProfile(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: aiRepliesKeys.all })
  });

export const updateAiReplyProfileMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...aiRepliesKeys.all, 'update_ai_reply_profile'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateAiReplyProfile>[1] }) =>
      updateAiReplyProfile(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: aiRepliesKeys.all })
  });

export const deleteAiReplyProfileMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...aiRepliesKeys.all, 'delete_ai_reply_profile'],
    mutationFn: ({ id }: { id: string }) => deleteAiReplyProfile(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: aiRepliesKeys.all })
  });

export const generateAiReplyMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...aiRepliesKeys.all, 'generate_ai_reply'],
    mutationFn: ({ body }: { body: Parameters<typeof generateAiReply>[0] }) =>
      generateAiReply(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: aiRepliesKeys.all })
  });
