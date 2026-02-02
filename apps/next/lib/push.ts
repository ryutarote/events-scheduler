import webpush from 'web-push';
import { Redis } from '@upstash/redis';

// VAPID configuration - defer initialization to runtime
let vapidConfigured = false;

function getVapidConfig() {
  return {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
  };
}

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;

  const config = getVapidConfig();

  // Validate that keys are present and appear to be valid base64
  if (!config.publicKey || !config.privateKey) {
    console.warn('[Push] VAPID keys not configured');
    return false;
  }

  // Check for valid base64 URL-safe format (no padding)
  if (config.publicKey.includes('=') || config.privateKey.includes('=')) {
    console.warn('[Push] VAPID keys should be URL-safe base64 without padding');
    return false;
  }

  try {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
    vapidConfigured = true;
    return true;
  } catch (error) {
    console.error('[Push] Failed to configure VAPID:', error);
    return false;
  }
}

// Redis client - lazy initialization
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  // Support both naming conventions
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    console.warn('[Redis] Upstash Redis not configured. URL:', !!url, 'Token:', !!token);
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

// Redis keys
const SUBSCRIPTIONS_KEY = 'push:subscriptions';
const SCHEDULES_KEY = 'push:schedules';

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
export async function getSubscriptions(): Promise<PushSubscription[]> {
  const client = getRedis();
  if (!client) return [];

  try {
    const data = await client.get<PushSubscription[]>(SUBSCRIPTIONS_KEY);
    return data || [];
  } catch (error) {
    console.error('[Redis] Failed to get subscriptions:', error);
    return [];
  }
}

export async function saveSubscription(subscription: PushSubscription): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const subscriptions = await getSubscriptions();
    const exists = subscriptions.some(s => s.endpoint === subscription.endpoint);

    if (!exists) {
      subscriptions.push(subscription);
      await client.set(SUBSCRIPTIONS_KEY, subscriptions);
      console.log('[Redis] Subscription saved');
    }
  } catch (error) {
    console.error('[Redis] Failed to save subscription:', error);
  }
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const subscriptions = await getSubscriptions();
    const filtered = subscriptions.filter(s => s.endpoint !== endpoint);
    await client.set(SUBSCRIPTIONS_KEY, filtered);
    console.log('[Redis] Subscription removed');
  } catch (error) {
    console.error('[Redis] Failed to remove subscription:', error);
  }
}

// Schedule management
export async function getSchedules(): Promise<ScheduledNotification[]> {
  const client = getRedis();
  if (!client) return [];

  try {
    const data = await client.get<ScheduledNotification[]>(SCHEDULES_KEY);
    return data || [];
  } catch (error) {
    console.error('[Redis] Failed to get schedules:', error);
    return [];
  }
}

export async function saveSchedule(schedule: ScheduledNotification): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const schedules = await getSchedules();
    // Remove any existing schedule for the same taskId
    const filtered = schedules.filter(s => s.taskId !== schedule.taskId);
    filtered.push(schedule);
    await client.set(SCHEDULES_KEY, filtered);
    console.log('[Redis] Schedule saved:', schedule.id);
  } catch (error) {
    console.error('[Redis] Failed to save schedule:', error);
  }
}

export async function removeSchedule(taskId: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const schedules = await getSchedules();
    const filtered = schedules.filter(s => s.taskId !== taskId);
    await client.set(SCHEDULES_KEY, filtered);
    console.log('[Redis] Schedule removed for task:', taskId);
  } catch (error) {
    console.error('[Redis] Failed to remove schedule:', error);
  }
}

export async function removeScheduleById(id: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const schedules = await getSchedules();
    const filtered = schedules.filter(s => s.id !== id);
    await client.set(SCHEDULES_KEY, filtered);
  } catch (error) {
    console.error('[Redis] Failed to remove schedule by id:', error);
  }
}

// Send push notification
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: { title: string; body: string; tag?: string }
): Promise<boolean> {
  if (!ensureVapidConfigured()) {
    console.error('[Push] Cannot send notification: VAPID not configured');
    return false;
  }

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
      await removeSubscription(subscription.endpoint);
    }
    return false;
  }
}

// Check and send due notifications
export async function checkAndSendDueNotifications(): Promise<number> {
  const now = new Date();
  const schedules = await getSchedules();
  const subscriptions = await getSubscriptions();

  console.log('[Cron] Checking notifications. Schedules:', schedules.length, 'Subscriptions:', subscriptions.length);

  let sentCount = 0;
  const schedulesToRemove: string[] = [];

  for (const schedule of schedules) {
    const scheduledTime = new Date(schedule.scheduledTime);

    if (scheduledTime <= now) {
      console.log('[Push] Sending due notification:', schedule.taskId, 'scheduled for:', scheduledTime.toISOString());

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
      } else if (subscriptions.length > 0) {
        // Send to all subscriptions as fallback
        console.log('[Push] No matching subscription, sending to all');
        for (const sub of subscriptions) {
          const success = await sendPushNotification(sub, {
            title: schedule.title,
            body: schedule.body,
            tag: schedule.taskId,
          });
          if (success) sentCount++;
        }
      }

      schedulesToRemove.push(schedule.id);
    }
  }

  // Remove sent schedules
  for (const id of schedulesToRemove) {
    await removeScheduleById(id);
  }

  return sentCount;
}

// Get VAPID public key
export function getVapidPublicKey(): string {
  return getVapidConfig().publicKey;
}
