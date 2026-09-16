import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { questionsKeys } from './queries';
import { updateQuestion, createAnswer } from './service';

export const updateQuestionMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...questionsKeys.all, 'update_question'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateQuestion>[1] }) =>
      updateQuestion(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: questionsKeys.all })
  });

export const createAnswerMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...questionsKeys.all, 'create_answer'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof createAnswer>[1] }) =>
      createAnswer(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: questionsKeys.all })
  });
