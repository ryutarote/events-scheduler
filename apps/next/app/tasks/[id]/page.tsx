import { TaskDetailPageClient } from './TaskDetailPageClient';

interface TaskDetailPageProps {
  params: { id: string };
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  return <TaskDetailPageClient taskId={params.id} />;
}
