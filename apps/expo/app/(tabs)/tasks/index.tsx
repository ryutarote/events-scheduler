import { TaskListScreen } from '@ticket-scheduler/app';
import { useNav } from '@/utils/navAdapter';

export default function TasksPage() {
  const nav = useNav();
  return <TaskListScreen nav={nav} />;
}
