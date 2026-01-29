import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';
import { ReactNativeWebProvider } from './ReactNativeWebProvider';

export const metadata: Metadata = {
  title: 'イベントスケジューラー',
  description: 'イベントの購入スケジュールを管理',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'イベント',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FF3B30',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}>
        <ReactNativeWebProvider>
          <ServiceWorkerRegistration />
          <div className="app-container" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <main className="main-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {children}
            </main>
            {/* iOS-style bottom tab bar */}
            <nav className="nav-tabs">
              <a href="/tasks" className="nav-tab">イベント</a>
              <a href="/devices" className="nav-tab">端末</a>
            </nav>
          </div>
        </ReactNativeWebProvider>
      </body>
    </html>
  );
}
