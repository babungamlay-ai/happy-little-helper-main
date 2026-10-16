export function projectProgress(tasks: { status: string; project_id: string | null }[], projectId: string) {
  const linked = tasks.filter(t => t.project_id === projectId);
  return { total: linked.length, completed: linked.filter(t => t.status === 'done').length, percent: linked.length ? Math.round(linked.filter(t => t.status === 'done').length / linked.length * 100) : 0 };
}
