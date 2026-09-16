import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { widgetsKeys } from './queries';
import { createWidget, updateWidget, deleteWidget, rotateWidgetKey } from './service';

export const createWidgetMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...widgetsKeys.all, 'create_widget'],
    mutationFn: ({ body }: { body: Parameters<typeof createWidget>[0] }) => createWidget(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: widgetsKeys.all })
  });

export const updateWidgetMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...widgetsKeys.all, 'update_widget'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateWidget>[1] }) =>
      updateWidget(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: widgetsKeys.all })
  });

export const deleteWidgetMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...widgetsKeys.all, 'delete_widget'],
    mutationFn: ({ id }: { id: string }) => deleteWidget(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: widgetsKeys.all })
  });

export const rotateWidgetKeyMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...widgetsKeys.all, 'rotate_widget_key'],
    mutationFn: ({ id }: { id: string }) => rotateWidgetKey(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: widgetsKeys.all })
  });
