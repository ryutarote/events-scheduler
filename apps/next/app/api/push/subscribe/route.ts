import { NextRequest, NextResponse } from 'next/server';
import { saveSubscription, removeSubscription, getVapidPublicKey, getSubscriptions } from '@/lib/push';

// Force dynamic rendering to prevent static analysis issues with VAPID keys
export const dynamic = 'force-dynamic';

// GET - Get VAPID public key or list subscriptions (debug)
export async function GET(request: NextRequest) {
  const isDebug = request.nextUrl.searchParams.get('debug') === '1';

  if (isDebug) {
    const subscriptions = await getSubscriptions();
    return NextResponse.json({ subscriptions });
  }

  const publicKey = getVapidPublicKey().trim(); // Remove any trailing newlines
  return NextResponse.json({ publicKey });
}

// POST - Save a push subscription
export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    if (!subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription' },
        { status: 400 }
      );
    }

    await saveSubscription({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    console.log('[API] Push subscription saved:', subscription.endpoint.slice(-20));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to save subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a push subscription
export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint required' },
        { status: 400 }
      );
    }

    await removeSubscription(endpoint);
    console.log('[API] Push subscription removed');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to remove subscription:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
