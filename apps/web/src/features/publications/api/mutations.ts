import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { publicationsKeys } from './queries';
import {
  createPublication,
  updatePublication,
  deletePublication,
  retryPublication
} from './service';

export const createPublicationMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...publicationsKeys.all, 'create_publication'],
    mutationFn: ({ body }: { body: Parameters<typeof createPublication>[0] }) =>
      createPublication(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: publicationsKeys.all })
  });

export const updatePublicationMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...publicationsKeys.all, 'update_publication'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updatePublication>[1] }) =>
      updatePublication(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: publicationsKeys.all })
  });

export const deletePublicationMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...publicationsKeys.all, 'delete_publication'],
    mutationFn: ({ id }: { id: string }) => deletePublication(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: publicationsKeys.all })
  });

export const retryPublicationMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...publicationsKeys.all, 'retry_publication'],
    mutationFn: ({ id }: { id: string }) => retryPublication(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: publicationsKeys.all })
  });
