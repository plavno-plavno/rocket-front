import { coreClient, query } from '@/lib/api';
import type { OperationBody } from '@lp/contracts';
import type { ListNotificationsQuery } from './types';

/** GET /notifications — Notifications */
export async function listNotifications(params?: ListNotificationsQuery) {
  const { data } = await coreClient().GET('/notifications', {
    params: { query: query(params ?? {}) }
  });
  return data!;
}

/** POST /notifications/read-all — Mark all as read */
export async function markAllNotificationsRead() {
  await coreClient().POST('/notifications/read-all');
}

/** POST /notifications/{id}/read — Mark one as read */
export async function markNotificationRead(id: string) {
  const { data } = await coreClient().POST('/notifications/{id}/read', {
    params: { path: { id } }
  });
  return data!;
}

/** GET /notifications/settings — Rules and channels */
export async function getNotificationSettings() {
  const { data } = await coreClient().GET('/notifications/settings');
  return data!;
}

/** PUT /notifications/settings — Update rules and channels */
export async function updateNotificationSettings(
  body: OperationBody<'update_notification_settings'>
) {
  const { data } = await coreClient().PUT('/notifications/settings', { body });
  return data!;
}
