'use client';

import { TaskEditScreen } from '@ticket-scheduler/app';
import { useNav } from '@/utils/navAdapter';

interface TaskEditPageClientProps {
  taskId: string;
}

export function TaskEditPageClient({ taskId }: TaskEditPageClientProps) {
  const nav = useNav();
  return <TaskEditScreen nav={nav} taskId={taskId} />;
}
