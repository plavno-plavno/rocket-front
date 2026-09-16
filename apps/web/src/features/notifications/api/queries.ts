import { queryOptions } from '@tanstack/react-query';
import { listNotifications, getNotificationSettings } from './service';
import type { ListNotificationsQuery } from './types';

/** Query keys: prefixed with the feature id; scoped lists include `scope` (SDD-01 §5.1). */
export const notificationsKeys = {
  all: ['notifications'] as const,
  notifications: (params?: ListNotificationsQuery) =>
    [...notificationsKeys.all, 'notifications', params ?? {}] as const,
  notificationSettings: () => [...notificationsKeys.all, 'notificationSettings'] as const
};

export const notificationsQueryOptions = (params?: ListNotificationsQuery) =>
  queryOptions({
    queryKey: notificationsKeys.notifications(params),
    queryFn: () => listNotifications(params)
  });

export const notificationSettingsQueryOptions = () =>
  queryOptions({
    queryKey: notificationsKeys.notificationSettings(),
    queryFn: () => getNotificationSettings()
  });
