'use client';

import { useEffect, useCallback, useState } from 'react';

// In-app notification state (global)
let showInAppNotification: ((title: string, body: string) => void) | null = null;

// Handle notification from Service Worker - just show in-app notification
// System notification is already handled by Service Worker using registration.showNotification()
const handleNotificationFromSW = (title: string, body: string) => {
  console.log('[Client] Received notification from SW:', title, body);

  // Show in-app notification as visual confirmation
  if (showInAppNotification) {
    showInAppNotification(title, body);
  }
};

// In-app notification component
function InAppNotification({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 10000); // Auto-close after 10 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        backgroundColor: '#1c1c1e',
        color: '#ffffff',
        padding: '16px 20px',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        zIndex: 10000,
        maxWidth: 320,
        animation: 'slideIn 0.3s ease-out',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 14, color: '#ababab' }}>{body}</div>
    </div>
  );
}

export function ServiceWorkerRegistration() {
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);

  const handleShowNotification = useCallback((title: string, body: string) => {
    setNotification({ title, body });
  }, []);

  useEffect(() => {
    // Register the in-app notification handler
    showInAppNotification = handleShowNotification;
    return () => {
      showInAppNotification = null;
    };
  }, [handleShowNotification]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Listen for messages from Service Worker
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};

      if (type === 'SHOW_NOTIFICATION' || type === 'SHOW_NOTIFICATION_FALLBACK') {
        console.log('[Client] Received notification message from SW:', type, payload);
        handleNotificationFromSW(payload.title, payload.body);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);
        console.log('Service Worker state:', registration.active?.state);

        // Check for updates immediately
        registration.update();

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('New Service Worker found, state:', newWorker?.state);

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('Service Worker state changed:', newWorker.state);
              if (newWorker.state === 'activated') {
                console.log('New Service Worker activated');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });

    // Listen for SW ready and subscribe to push
    navigator.serviceWorker.ready.then(async (registration) => {
      console.log('Service Worker ready:', registration.active?.state);

      // Try to subscribe to push notifications
      try {
        // Check if Notification permission is granted
        if (Notification.permission === 'granted') {
          // Get VAPID public key from server
          const response = await fetch('/api/push/subscribe');
          const { publicKey } = await response.json();

          if (publicKey) {
            // Check for existing subscription
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
              // URL-safe base64 helper
              const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
                const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
                const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
                const rawData = atob(base64);
                const outputArray = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; ++i) {
                  outputArray[i] = rawData.charCodeAt(i);
                }
                return outputArray;
              };

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
            console.log('[Push] Subscription saved to server');
          }
        }
      } catch (error) {
        console.warn('[Push] Failed to subscribe:', error);
      }
    });

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <>
      {notification && (
        <InAppNotification
          title={notification.title}
          body={notification.body}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
}
