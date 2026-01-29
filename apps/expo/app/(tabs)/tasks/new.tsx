import { TaskEditScreen } from '@ticket-scheduler/app';
import { useNav } from '@/utils/navAdapter';

export default function NewTaskPage() {
  const nav = useNav();
  return <TaskEditScreen nav={nav} />;
}
