import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { communicationKeys } from './queries';
import { updateConversation, sendConversationMessage } from './service';

export const updateConversationMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...communicationKeys.all, 'update_conversation'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateConversation>[1] }) =>
      updateConversation(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: communicationKeys.all })
  });

export const sendConversationMessageMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...communicationKeys.all, 'send_conversation_message'],
    mutationFn: ({
      id,
      body
    }: {
      id: string;
      body: Parameters<typeof sendConversationMessage>[1];
    }) => sendConversationMessage(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: communicationKeys.all })
  });
