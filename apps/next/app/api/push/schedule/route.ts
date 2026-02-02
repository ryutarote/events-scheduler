import { NextRequest, NextResponse } from 'next/server';
import { saveSchedule, removeSchedule, getSchedules, checkAndSendDueNotifications } from '@/lib/push';

// Force dynamic rendering to prevent static analysis issues with VAPID keys
export const dynamic = 'force-dynamic';

// GET - Check and send due notifications (Vercel Cron endpoint)
export async function GET(request: NextRequest) {
  try {
    // Check if this is a cron request or debug request
    const isCron = request.headers.get('x-vercel-cron') === '1';
    const isDebug = request.nextUrl.searchParams.get('debug') === '1';

    if (isDebug && !isCron) {
      // Debug mode: return schedules
      const schedules = await getSchedules();
      return NextResponse.json({ schedules });
    }

    // Cron mode: check and send due notifications
    const sentCount = await checkAndSendDueNotifications();
    console.log('[Cron] Check complete, sent:', sentCount, 'notifications');
    return NextResponse.json({ success: true, sentCount });
  } catch (error) {
    console.error('[API] Failed to process request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// POST - Schedule a notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      taskId,
      title,
      body: notificationBody,
      scheduledDate,
      scheduledTime,
      reminderMinutes,
      subscriptionEndpoint,
    } = body;

    if (!taskId || !title || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate notification time
    const eventTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    const notificationTime = new Date(
      eventTime.getTime() - (reminderMinutes || 0) * 60 * 1000
    );
    const now = new Date();

    // Don't schedule if event time has passed
    if (eventTime <= now) {
      return NextResponse.json(
        { error: 'Event time has already passed' },
        { status: 400 }
      );
    }

    const schedule = {
      id: `${taskId}-${Date.now()}`,
      taskId,
      title,
      body: notificationBody || `まもなく開始: ${scheduledTime}`,
      scheduledTime: notificationTime.toISOString(),
      subscriptionEndpoint: subscriptionEndpoint || '',
      createdAt: now.toISOString(),
    };

    await saveSchedule(schedule);

    console.log(
      '[API] Notification scheduled for:',
      notificationTime.toLocaleString(),
      '(in',
      Math.round((notificationTime.getTime() - now.getTime()) / 1000 / 60),
      'minutes)'
    );

    return NextResponse.json({
      success: true,
      scheduledTime: notificationTime.toISOString(),
    });
  } catch (error) {
    console.error('[API] Failed to schedule notification:', error);
    return NextResponse.json(
      { error: 'Failed to schedule notification' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a scheduled notification
export async function DELETE(request: NextRequest) {
  try {
    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID required' },
        { status: 400 }
      );
    }

    await removeSchedule(taskId);
    console.log('[API] Notification cancelled for task:', taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to cancel notification:', error);
    return NextResponse.json(
      { error: 'Failed to cancel notification' },
      { status: 500 }
    );
  }
}

// PATCH - Check and send due notifications (cron endpoint)
export async function PATCH() {
  try {
    const sentCount = await checkAndSendDueNotifications();
    console.log('[API] Cron check complete, sent:', sentCount, 'notifications');
    return NextResponse.json({ success: true, sentCount });
  } catch (error) {
    console.error('[API] Failed to check notifications:', error);
    return NextResponse.json(
      { error: 'Failed to check notifications' },
      { status: 500 }
    );
  }
}
