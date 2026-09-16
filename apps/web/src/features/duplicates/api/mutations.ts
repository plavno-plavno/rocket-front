import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { duplicatesKeys } from './queries';
import { actOnDuplicate } from './service';

export const actOnDuplicateMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...duplicatesKeys.all, 'act_on_duplicate'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof actOnDuplicate>[1] }) =>
      actOnDuplicate(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: duplicatesKeys.all })
  });
