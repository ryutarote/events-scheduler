import { TaskEditScreen } from '@ticket-scheduler/app';
import { useLocalSearchParams } from 'expo-router';
import { useNav } from '@/utils/navAdapter';

export default function TaskEditPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNav();
  return <TaskEditScreen nav={nav} taskId={id} />;
}
