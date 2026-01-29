// Service Worker for Ticket Scheduler
// Handles background notifications with IndexedDB persistence

const CACHE_NAME = 'ticket-scheduler-v1';
const DB_NAME = 'ticket-scheduler-notifications';
const DB_VERSION = 1;
const STORE_NAME = 'scheduled-notifications';

// In-memory timers (will be restored from DB on activation)
let activeTimers = new Map();
let timersRestored = false; // Flag to prevent multiple restoration

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'taskId' });
      }
    };
  });
}

// Save notification to IndexedDB
async function saveNotification(notification) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await new Promise((resolve, reject) => {
      const request = store.put(notification);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });
    db.close();
    console.log('[SW] Notification saved to IndexedDB:', notification.taskId);
  } catch (error) {
    console.error('[SW] Failed to save notification:', error);
  }
}

// Delete notification from IndexedDB
async function deleteNotification(taskId) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await new Promise((resolve, reject) => {
      const request = store.delete(taskId);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });
    db.close();
    console.log('[SW] Notification deleted from IndexedDB:', taskId);
  } catch (error) {
    console.error('[SW] Failed to delete notification:', error);
  }
}

// Get all notifications from IndexedDB
async function getAllNotifications() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const notifications = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return notifications;
  } catch (error) {
    console.error('[SW] Failed to get notifications:', error);
    return [];
  }
}

// Clear all notifications from IndexedDB
async function clearAllNotifications() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });
    db.close();
    console.log('[SW] All notifications cleared from IndexedDB');
  } catch (error) {
    console.error('[SW] Failed to clear notifications:', error);
  }
}

// Restore timers from IndexedDB
async function restoreTimers(force = false) {
  // Prevent multiple restorations unless forced
  if (timersRestored && !force) {
    console.log('[SW] Timers already restored, skipping...');
    return;
  }

  console.log('[SW] Restoring timers from IndexedDB...');
  timersRestored = true;

  const notifications = await getAllNotifications();
  const now = Date.now();

  console.log('[SW] Found', notifications.length, 'notifications in IndexedDB');

  for (const notification of notifications) {
    const scheduledTime = new Date(notification.scheduledTime).getTime();

    // Skip if already has an active timer
    if (activeTimers.has(notification.taskId)) {
      console.log('[SW] Timer already active for:', notification.taskId);
      continue;
    }

    if (scheduledTime <= now) {
      // Time has passed, show notification immediately
      console.log('[SW] Notification time passed, showing now:', notification.taskId);
      showNotification(notification.title, notification.body, notification.taskId);
      await deleteNotification(notification.taskId);
    } else {
      // Schedule timer
      const delay = scheduledTime - now;
      console.log(`[SW] Restoring timer for ${notification.taskId}, delay: ${Math.round(delay / 1000 / 60)} minutes (${Math.round(delay / 1000)} seconds)`);

      const timeoutId = setTimeout(async () => {
        console.log('[SW] Timer fired for:', notification.taskId);
        showNotification(notification.title, notification.body, notification.taskId);
        await deleteNotification(notification.taskId);
        activeTimers.delete(notification.taskId);
      }, delay);

      activeTimers.set(notification.taskId, timeoutId);
    }
  }

  console.log(`[SW] Restored ${activeTimers.size} active timers`);
}

// Ensure timers are restored on any SW wake-up
async function ensureTimersRestored() {
  if (!timersRestored) {
    await restoreTimers();
  }
}

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    clients.claim().then(() => {
      return restoreTimers();
    })
  );
});

// Message handler for scheduling notifications
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data;
  console.log('[SW] Message received:', type);

  // Ensure timers are restored when SW wakes up
  await ensureTimersRestored();

  switch (type) {
    case 'SCHEDULE_NOTIFICATION':
      await scheduleNotification(payload);
      break;
    case 'CANCEL_NOTIFICATION':
      await cancelNotification(payload.taskId);
      break;
    case 'CANCEL_ALL_NOTIFICATIONS':
      await cancelAllNotifications();
      break;
    case 'GET_SCHEDULED_NOTIFICATIONS':
      getAllNotifications().then(notifications => {
        event.ports[0].postMessage(notifications);
      });
      break;
    case 'TEST_NOTIFICATION':
      showNotification('テスト通知', 'Service Workerからの通知テストです。', 'test');
      break;
    case 'IMMEDIATE_NOTIFICATION':
      showNotification(payload.title, payload.body, payload.taskId);
      break;
    case 'CHECK_TIMERS':
      // Debug: Check current timer status
      console.log('[SW] Active timers:', activeTimers.size);
      const allNotifs = await getAllNotifications();
      console.log('[SW] IndexedDB notifications:', allNotifs);
      break;
  }
});

// Schedule a notification
async function scheduleNotification(payload) {
  const { taskId, title, body, scheduledDate, scheduledTime, reminderMinutes } = payload;

  console.log('[SW] scheduleNotification called:', { taskId, title, scheduledDate, scheduledTime, reminderMinutes });

  // Calculate notification time
  const eventTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
  const notificationTime = new Date(eventTime.getTime() - reminderMinutes * 60 * 1000);
  const now = new Date();

  console.log('[SW] Event time:', eventTime.toLocaleString());
  console.log('[SW] Notification time:', notificationTime.toLocaleString());
  console.log('[SW] Current time:', now.toLocaleString());

  // Don't schedule if event time has passed
  if (eventTime <= now) {
    console.log('[SW] Event time has already passed, not scheduling');
    return;
  }

  // Cancel existing notification for this task
  await cancelNotification(taskId);

  // If notification time has passed but event time hasn't, send immediately
  if (notificationTime <= now) {
    console.log('[SW] Notification time passed but event is future, sending immediately');
    showNotification(title, body, taskId);
    return;
  }

  const delay = notificationTime.getTime() - now.getTime();

  // Save to IndexedDB first (this persists across SW restarts)
  const notification = {
    taskId,
    title,
    body,
    scheduledTime: notificationTime.toISOString(),
  };
  await saveNotification(notification);
  console.log('[SW] Notification saved to IndexedDB');

  // Schedule the timer
  const timeoutId = setTimeout(async () => {
    console.log('[SW] Timer fired for:', taskId);
    showNotification(title, body, taskId);
    await deleteNotification(taskId);
    activeTimers.delete(taskId);
  }, delay);

  activeTimers.set(taskId, timeoutId);

  console.log(`[SW] Notification scheduled for ${notificationTime.toLocaleString()} (in ${Math.round(delay / 1000 / 60)} minutes, ${Math.round(delay / 1000)} seconds)`);
}

// Cancel a scheduled notification
async function cancelNotification(taskId) {
  // Clear timer
  const timeoutId = activeTimers.get(taskId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    activeTimers.delete(taskId);
  }

  // Delete from IndexedDB
  await deleteNotification(taskId);

  console.log(`[SW] Notification cancelled for task: ${taskId}`);
}

// Cancel all scheduled notifications
async function cancelAllNotifications() {
  // Clear all timers
  activeTimers.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });
  activeTimers.clear();

  // Clear IndexedDB
  await clearAllNotifications();

  console.log('[SW] All notifications cancelled');
}

// Show a notification - Use Service Worker notification API (works reliably on macOS)
async function showNotification(title, body, tag) {
  console.log('[SW] Showing notification:', title, body);

  try {
    // Always use Service Worker notification API (works better on macOS)
    await self.registration.showNotification(title, {
      body,
      tag: tag || 'default',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      requireInteraction: false, // macOS ignores this anyway
      silent: false,
      vibrate: [200, 100, 200],
    });
    console.log('[SW] System notification shown via Service Worker');

    // Also notify clients for in-app notification
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (allClients.length > 0) {
      allClients.forEach(client => {
        client.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: { title, body, tag }
        });
      });
      console.log('[SW] In-app notification sent to clients');
    }
  } catch (error) {
    console.error('[SW] Failed to show notification:', error);

    // Fallback: try to notify clients only
    try {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      allClients.forEach(client => {
        client.postMessage({
          type: 'SHOW_NOTIFICATION_FALLBACK',
          payload: { title, body, tag }
        });
      });
    } catch (e) {
      console.error('[SW] Fallback also failed:', e);
    }
  }
}

// Push event handler - Receives push notifications from server
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');

  let data = { title: '通知', body: '' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  console.log('[SW] Push data:', data);

  const options = {
    body: data.body,
    tag: data.tag || 'push-notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('/tasks') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/tasks');
      }
    })
  );
});

// Periodic sync for checking scheduled notifications (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  if (event.tag === 'check-notifications') {
    event.waitUntil(restoreTimers());
  }
});

// Wake up event - restore timers on any fetch
self.addEventListener('fetch', (event) => {
  // Restore timers when SW wakes up
  event.waitUntil(ensureTimersRestored());

  // We don't intercept any fetches, just pass them through
});

console.log('[SW] Service Worker script loaded');
