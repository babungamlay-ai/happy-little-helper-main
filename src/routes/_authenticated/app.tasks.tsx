import { createFileRoute } from '@tanstack/react-router';
import { TaskWorkspace } from '@/components/task-workspace';
import { pageMeta } from '@/lib/page-meta';
export const Route = createFileRoute('/_authenticated/app/tasks')({ head: () => pageMeta('Team tasks — TDSP Portal','Organize and track TDSP project tasks.'), component: () => <TaskWorkspace mine={false} /> });
