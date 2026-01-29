import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

// VAPID configuration
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Data storage paths
const DATA_DIR = path.join(process.cwd(), 'data');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');
const SCHEDULES_FILE = path.join(DATA_DIR, 'schedules.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Types
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface ScheduledNotification {
  id: string;
  taskId: string;
  title: string;
  body: string;
  scheduledTime: string; // ISO string
  subscriptionEndpoint: string;
  createdAt: string;
}

// Subscription management
export function getSubscriptions(): PushSubscription[] {
  ensureDataDir();
  if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveSubscription(subscription: PushSubscription): void {
  ensureDataDir();
  const subscriptions = getSubscriptions();

  // Check if subscription already exists
  const exists = subscriptions.some(s => s.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
  }
}

export function removeSubscription(endpoint: string): void {
  ensureDataDir();
  const subscriptions = getSubscriptions().filter(s => s.endpoint !== endpoint);
  fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
}

// Schedule management
export function getSchedules(): ScheduledNotification[] {
  ensureDataDir();
  if (!fs.existsSync(SCHEDULES_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(SCHEDULES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveSchedule(schedule: ScheduledNotification): void {
  ensureDataDir();
  const schedules = getSchedules();

  // Remove any existing schedule for the same taskId
  const filtered = schedules.filter(s => s.taskId !== schedule.taskId);
  filtered.push(schedule);
  fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(filtered, null, 2));
}

export function removeSchedule(taskId: string): void {
  ensureDataDir();
  const schedules = getSchedules().filter(s => s.taskId !== taskId);
  fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2));
}

export function removeScheduleById(id: string): void {
  ensureDataDir();
  const schedules = getSchedules().filter(s => s.id !== id);
  fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2));
}

// Send push notification
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: { title: string; body: string; tag?: string }
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload)
    );
    console.log('[Push] Notification sent successfully');
    return true;
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    console.error('[Push] Failed to send notification:', error);

    // If subscription is invalid, remove it
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.log('[Push] Subscription expired, removing...');
      removeSubscription(subscription.endpoint);
    }
    return false;
  }
}

// Check and send due notifications
export async function checkAndSendDueNotifications(): Promise<number> {
  const now = new Date();
  const schedules = getSchedules();
  const subscriptions = getSubscriptions();

  let sentCount = 0;
  const schedulesToRemove: string[] = [];

  for (const schedule of schedules) {
    const scheduledTime = new Date(schedule.scheduledTime);

    if (scheduledTime <= now) {
      console.log('[Push] Sending due notification:', schedule.taskId);

      // Find the subscription for this schedule
      const subscription = subscriptions.find(s => s.endpoint === schedule.subscriptionEndpoint);

      if (subscription) {
        const success = await sendPushNotification(subscription, {
          title: schedule.title,
          body: schedule.body,
          tag: schedule.taskId,
        });

        if (success) {
          sentCount++;
        }
      } else {
        // Also send to all subscriptions as fallback
        for (const sub of subscriptions) {
          await sendPushNotification(sub, {
            title: schedule.title,
            body: schedule.body,
            tag: schedule.taskId,
          });
          sentCount++;
        }
      }

      schedulesToRemove.push(schedule.id);
    }
  }

  // Remove sent schedules
  for (const id of schedulesToRemove) {
    removeScheduleById(id);
  }

  return sentCount;
}

// Get VAPID public key
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
