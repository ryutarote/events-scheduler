import { TaskDetailScreen } from '@ticket-scheduler/app';
import { useLocalSearchParams } from 'expo-router';
import { useNav } from '@/utils/navAdapter';

export default function TaskDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNav();
  return <TaskDetailScreen nav={nav} taskId={id ?? ''} />;
}
