'use client';

import { DevicePairScreen } from '@ticket-scheduler/app';
import { useNav } from '@/utils/navAdapter';

export function DevicePairPageClient() {
  const nav = useNav();
  return <DevicePairScreen nav={nav} />;
}
