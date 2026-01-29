'use client';

import { TaskListScreen } from '@ticket-scheduler/app';
import { useNav } from '@/utils/navAdapter';

export function TasksPageClient() {
  const nav = useNav();
  return <TaskListScreen nav={nav} />;
}
