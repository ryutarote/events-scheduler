'use client';

import { DeviceListScreen } from '@ticket-scheduler/app';
import { useNav } from '@/utils/navAdapter';

export function DevicesPageClient() {
  const nav = useNav();
  return <DeviceListScreen nav={nav} />;
}
