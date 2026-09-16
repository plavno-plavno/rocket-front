import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { notificationsKeys } from './queries';
import {
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationSettings
} from './service';

export const markAllNotificationsReadMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...notificationsKeys.all, 'mark_all_notifications_read'],
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsKeys.all })
  });

export const markNotificationReadMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...notificationsKeys.all, 'mark_notification_read'],
    mutationFn: ({ id }: { id: string }) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsKeys.all })
  });

export const updateNotificationSettingsMutation = (qc: QueryClient) =>
  mutationOptions({
    mutationKey: [...notificationsKeys.all, 'update_notification_settings'],
    mutationFn: ({ body }: { body: Parameters<typeof updateNotificationSettings>[0] }) =>
      updateNotificationSettings(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationsKeys.all })
  });
