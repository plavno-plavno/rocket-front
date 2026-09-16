import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { autoRepliesKeys } from './queries';
import {
  createAutoReplyRule,
  updateAutoReplyRule,
  deleteAutoReplyRule,
  reorderAutoReplyRules
} from './service';

export const createAutoReplyRuleMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...autoRepliesKeys.all, 'create_auto_reply_rule'],
    mutationFn: ({ body }: { body: Parameters<typeof createAutoReplyRule>[0] }) =>
      createAutoReplyRule(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: autoRepliesKeys.all })
  });

export const updateAutoReplyRuleMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...autoRepliesKeys.all, 'update_auto_reply_rule'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateAutoReplyRule>[1] }) =>
      updateAutoReplyRule(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: autoRepliesKeys.all })
  });

export const deleteAutoReplyRuleMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...autoRepliesKeys.all, 'delete_auto_reply_rule'],
    mutationFn: ({ id }: { id: string }) => deleteAutoReplyRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: autoRepliesKeys.all })
  });

export const reorderAutoReplyRulesMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...autoRepliesKeys.all, 'reorder_auto_reply_rules'],
    mutationFn: ({ body }: { body: Parameters<typeof reorderAutoReplyRules>[0] }) =>
      reorderAutoReplyRules(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: autoRepliesKeys.all })
  });
