import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { presenceKeys } from './queries';
import { exportPresence } from './service';

export const exportPresenceMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...presenceKeys.all, 'export_presence'],
    mutationFn: ({
      body,
      params
    }: {
      body: Parameters<typeof exportPresence>[0];
      params?: Parameters<typeof exportPresence>[1];
    }) => exportPresence(body, params),
    onSuccess: () => qc.invalidateQueries({ queryKey: presenceKeys.all })
  });
