// Web Notifications API implementation with Service Worker and Push support

export interface ScheduledNotification {
  id: string;
  taskId: string;
  title: string;
  body: string;
  scheduledTime: Date;
  timeoutId?: ReturnType<typeof setTimeout>;
}

// Store scheduled notifications in memory (fallback)
const scheduledNotifications: Map<string, ScheduledNotification> = new Map();

// Push subscription endpoint
let currentSubscriptionEndpoint: string | null = null;

// Get Service Worker registration
const getServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
};

// Send message to Service Worker
const sendToServiceWorker = async (type: string, payload: unknown): Promise<void> => {
  const registration = await getServiceWorker();
  if (registration?.active) {
    registration.active.postMessage({ type, payload });
  }
};

// URL-safe base64 helper
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const registration = await getServiceWorker();
    if (!registration) {
      console.warn('[Push] Service Worker not available');
      return false;
    }

    // Get VAPID public key from server
    const response = await fetch('/api/push/subscribe');
    const { publicKey } = await response.json();

    if (!publicKey) {
      console.warn('[Push] VAPID public key not available');
      return false;
    }

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });
      console.log('[Push] New subscription created');
    } else {
      console.log('[Push] Using existing subscription');
    }

    // Save subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });

    currentSubscriptionEndpoint = subscription.endpoint;
    console.log('[Push] Subscription saved to server');
    return true;
  } catch (error) {
    console.error('[Push] Failed to subscribe:', error);
    return false;
  }
}

// Check if push is subscribed
export async function isPushSubscribed(): Promise<boolean> {
  const registration = await getServiceWorker();
  if (!registration) return false;

  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}

// Get current subscription endpoint
export function getSubscriptionEndpoint(): string | null {
  return currentSubscriptionEndpoint;
}

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications not supported in this browser');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission denied');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Check if notifications are permitted
export const hasNotificationPermission = (): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
};

// Schedule a notification (uses Server Push API for reliable delivery)
export const scheduleNotification = async (
  taskId: string,
  title: string,
  body: string,
  scheduledDate: string,
  scheduledTime: string,
  reminderMinutes: number
): Promise<string | null> => {
  console.log('[Notifications] scheduleNotification called:', { taskId, title, scheduledDate, scheduledTime, reminderMinutes });

  const hasPermission = await requestNotificationPermission();
  console.log('[Notifications] hasPermission:', hasPermission);
  if (!hasPermission) {
    console.warn('Cannot schedule notification: permission not granted');
    return null;
  }

  // Calculate notification time
  const eventTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
  const notificationTime = new Date(eventTime.getTime() - reminderMinutes * 60 * 1000);
  const now = new Date();

  console.log('[Notifications] eventTime:', eventTime.toLocaleString());
  console.log('[Notifications] notificationTime:', notificationTime.toLocaleString());
  console.log('[Notifications] now:', now.toLocaleString());

  // Don't schedule if event time has passed
  if (eventTime <= now) {
    console.warn('[Notifications] Event time has already passed');
    return null;
  }

  const notificationId = `${taskId}-${Date.now()}`;

  // If notification time has passed but event time hasn't, send immediately
  if (notificationTime <= now) {
    console.log('[Notifications] Notification time passed but event is future, sending immediately');

    // Try to use Service Worker for immediate notification
    const registration = await getServiceWorker();
    if (registration?.active) {
      await sendToServiceWorker('IMMEDIATE_NOTIFICATION', {
        taskId,
        title,
        body,
      });
      console.log('[SW] Immediate notification sent');
      return notificationId;
    }

    // Fallback: show notification directly
    showNotification(title, body, taskId);
    return notificationId;
  }

  const delay = notificationTime.getTime() - now.getTime();

  // Try to use Server Push API (works even when browser is closed)
  try {
    const response = await fetch('/api/push/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId,
        title,
        body,
        scheduledDate,
        scheduledTime,
        reminderMinutes,
        subscriptionEndpoint: currentSubscriptionEndpoint,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[Push API] Notification scheduled for ${result.scheduledTime} (in ${Math.round(delay / 1000 / 60)} minutes)`);
      return notificationId;
    }
    console.warn('[Push API] Failed to schedule, falling back to SW');
  } catch (error) {
    console.warn('[Push API] Error, falling back to SW:', error);
  }

  // Fallback: Try to use Service Worker for background notifications
  const registration = await getServiceWorker();
  if (registration?.active) {
    await sendToServiceWorker('SCHEDULE_NOTIFICATION', {
      taskId,
      title,
      body,
      scheduledDate,
      scheduledTime,
      reminderMinutes,
    });
    console.log(`[SW] Notification scheduled for ${notificationTime.toLocaleString()} (in ${Math.round(delay / 1000 / 60)} minutes)`);
    return notificationId;
  }

  // Final fallback: use setTimeout (only works while browser is open)
  cancelNotification(taskId);

  const timeoutId = setTimeout(() => {
    showNotification(title, body, taskId);
    scheduledNotifications.delete(notificationId);
  }, delay);

  const notification: ScheduledNotification = {
    id: notificationId,
    taskId,
    title,
    body,
    scheduledTime: notificationTime,
    timeoutId,
  };

  scheduledNotifications.set(taskId, notification);

  console.log(`[Fallback] Notification scheduled for ${notificationTime.toLocaleString()} (in ${Math.round(delay / 1000 / 60)} minutes)`);

  return notificationId;
};

// Show a notification immediately
const showNotification = (title: string, body: string, tag?: string): void => {
  if (!hasNotificationPermission()) {
    return;
  }

  const notification = new Notification(title, {
    body,
    tag,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    requireInteraction: true,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
};

// Cancel a scheduled notification
export const cancelNotification = async (taskId: string): Promise<void> => {
  // Cancel on server
  try {
    await fetch('/api/push/schedule', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });
    console.log(`[Push API] Notification cancelled for task: ${taskId}`);
  } catch (error) {
    console.warn('[Push API] Failed to cancel on server:', error);
  }

  // Cancel in Service Worker
  await sendToServiceWorker('CANCEL_NOTIFICATION', { taskId });

  // Also cancel local fallback
  const notification = scheduledNotifications.get(taskId);
  if (notification?.timeoutId) {
    clearTimeout(notification.timeoutId);
    scheduledNotifications.delete(taskId);
  }
  console.log(`Notification cancelled for task: ${taskId}`);
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async (): Promise<void> => {
  // Cancel in Service Worker
  await sendToServiceWorker('CANCEL_ALL_NOTIFICATIONS', {});

  // Also cancel local fallback
  scheduledNotifications.forEach((notification) => {
    if (notification.timeoutId) {
      clearTimeout(notification.timeoutId);
    }
  });
  scheduledNotifications.clear();
};

// Get all scheduled notifications
export const getScheduledNotifications = (): ScheduledNotification[] => {
  return Array.from(scheduledNotifications.values());
};

// Test notification (for debugging)
export const testNotification = async (): Promise<void> => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Try Service Worker first
  const registration = await getServiceWorker();
  if (registration?.active) {
    await sendToServiceWorker('TEST_NOTIFICATION', {});
    console.log('Test notification sent via Service Worker');
    return;
  }

  // Fallback
  showNotification('テスト通知', 'これはテスト通知です。通知機能は正常に動作しています。', 'test');
};

// Test scheduled notification (1 minute delay)
export const testScheduledNotification = async (): Promise<string | null> => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.warn('Cannot test: permission not granted');
    return null;
  }

  // Schedule notification for 1 minute from now
  const now = new Date();
  const notifyTime = new Date(now.getTime() + 60 * 1000); // 1 minute from now

  const scheduledDate = notifyTime.toISOString().split('T')[0];
  const scheduledTime = notifyTime.toTimeString().slice(0, 5);

  console.log('[Test] Scheduling notification for:', notifyTime.toLocaleString());

  const result = await scheduleNotification(
    'test-scheduled-' + Date.now(),
    'スケジュールテスト通知',
    '1分後に設定されたスケジュール通知です',
    scheduledDate,
    scheduledTime,
    0 // reminderMinutes = 0 means notify at the scheduled time
  );

  console.log('[Test] Scheduled notification result:', result);
  return result;
};

// Debug: Check scheduled notifications in Service Worker
export const debugCheckTimers = async (): Promise<void> => {
  const registration = await getServiceWorker();
  if (registration?.active) {
    await sendToServiceWorker('CHECK_TIMERS', {});
    console.log('[Debug] CHECK_TIMERS message sent to Service Worker');
  }
};
