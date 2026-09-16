import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { tagsKeys } from './queries';
import { createTag, updateTag, deleteTag } from './service';

export const createTagMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...tagsKeys.all, 'create_tag'],
    mutationFn: ({ body }: { body: Parameters<typeof createTag>[0] }) => createTag(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagsKeys.all })
  });

export const updateTagMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...tagsKeys.all, 'update_tag'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateTag>[1] }) =>
      updateTag(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagsKeys.all })
  });

export const deleteTagMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...tagsKeys.all, 'delete_tag'],
    mutationFn: ({ id }: { id: string }) => deleteTag(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagsKeys.all })
  });
