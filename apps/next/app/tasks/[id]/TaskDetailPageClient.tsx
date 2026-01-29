'use client';

import { TaskDetailScreen } from '@ticket-scheduler/app';
import { useNav } from '@/utils/navAdapter';

interface TaskDetailPageClientProps {
  taskId: string;
}

export function TaskDetailPageClient({ taskId }: TaskDetailPageClientProps) {
  const nav = useNav();
  return <TaskDetailScreen nav={nav} taskId={taskId} />;
}
