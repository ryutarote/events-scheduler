import { TaskEditPageClient } from './TaskEditPageClient';

interface TaskEditPageProps {
  params: { id: string };
}

export default function TaskEditPage({ params }: TaskEditPageProps) {
  return <TaskEditPageClient taskId={params.id} />;
}
