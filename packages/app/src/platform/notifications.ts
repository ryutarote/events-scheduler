// Default export for notifications - will be replaced by platform-specific implementations
export {
  requestNotificationPermission,
  hasNotificationPermission,
  scheduleNotification,
  cancelNotification,
  cancelAllNotifications,
  getScheduledNotifications,
  testNotification,
  testScheduledNotification,
  debugCheckTimers,
  subscribeToPush,
  isPushSubscribed,
  getSubscriptionEndpoint,
} from './notifications.web';
