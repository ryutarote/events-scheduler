'use client';

import { TaskEditScreen } from '@ticket-scheduler/app';
import { useNav } from '@/utils/navAdapter';

export function NewTaskPageClient() {
  const nav = useNav();
  return <TaskEditScreen nav={nav} />;
}
