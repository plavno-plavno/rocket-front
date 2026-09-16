import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { rankKeys } from './queries';
import { createRankProject, updateRankProject, deleteRankProject, runRankProject } from './service';

export const createRankProjectMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...rankKeys.all, 'create_rank_project'],
    mutationFn: ({ body }: { body: Parameters<typeof createRankProject>[0] }) =>
      createRankProject(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: rankKeys.all })
  });

export const updateRankProjectMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...rankKeys.all, 'update_rank_project'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateRankProject>[1] }) =>
      updateRankProject(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: rankKeys.all })
  });

export const deleteRankProjectMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...rankKeys.all, 'delete_rank_project'],
    mutationFn: ({ id }: { id: string }) => deleteRankProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: rankKeys.all })
  });

export const runRankProjectMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...rankKeys.all, 'run_rank_project'],
    mutationFn: ({ id }: { id: string }) => runRankProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: rankKeys.all })
  });
