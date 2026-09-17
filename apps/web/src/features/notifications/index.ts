/** Public API of the notifications feature (SDD-01T §3.5). */
export { NotificationBell } from './components/notification-bell';
export {
  notificationsQueryOptions,
  notificationSettingsQueryOptions,
  notificationsKeys
} from './api/queries';
export { updateNotificationSettingsMutation } from './api/mutations';
export type { Notification, NotificationSettings } from './api/types';
