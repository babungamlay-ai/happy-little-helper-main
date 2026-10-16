import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, ClipboardList, Clock, Flag } from 'lucide-react';
import { CrudTable, opts } from '@/components/crud-table';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useDirectory } from '@/lib/portal-data';
import { supabase } from '@/integrations/supabase/client';

export function TaskWorkspace({ mine = false }: { mine?: boolean }) {
  const a = useAuth();
  const qc = useQueryClient();
  const directory = useDirectory(a.rolesLoaded);
  const q = useQuery({ queryKey: ['task-summary', a.user?.id], enabled: !!a.user, queryFn: async () => {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
    return data ?? [];
  } });
  const tasks = (q.data ?? []).filter(t => !mine || t.assignee_id === a.user?.id);
  const counts = [{ label: 'Total tasks', value: tasks.length, icon: ClipboardList }, { label: 'In progress', value: tasks.filter(t => t.status === 'in_progress').length, icon: Clock }, { label: 'In review', value: tasks.filter(t => t.status === 'review').length, icon: Flag }, { label: 'Completed', value: tasks.filter(t => t.status === 'done').length, icon: CheckCircle2 }];
  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('tasks').update({ status }).eq('id',id);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ['tasks'] });
    await qc.invalidateQueries({ queryKey: ['task-summary'] });
  }
  return <div className="space-y-8"><div className="grid grid-cols-2 gap-5 border-b border-border pb-7 lg:grid-cols-4">{counts.map(c => <div key={c.label}><c.icon className="mb-3 h-5 w-5 text-primary" /><p className="text-3xl font-semibold">{q.isPending ? '—' : c.value}</p><p className="mt-1 text-sm text-muted-foreground">{c.label}</p></div>)}</div><CrudTable table="tasks" title={mine ? 'My tasks' : 'Team tasks'} canWrite={a.isManager} defaults={{ status: 'todo', priority: 'medium', created_by: a.user?.id }} queryKey={['tasks',mine,a.user?.id]} filter={mine ? query => query.eq('assignee_id',a.user?.id) : query => query} fields={[
    { key:'title',label:'Task',required:true }, { key:'description',label:'Description',type:'textarea',hideInTable:true }, { key:'project_id',label:'Project',type:'select',options:directory.data?.projects ?? [] }, { key:'assignee_id',label:'Assigned to',type:'select',options:directory.data?.people ?? [] }, { key:'status',label:'Status',type:'select',options:opts('todo','in_progress','review','done'),required:true }, { key:'priority',label:'Priority',type:'select',options:opts('low','medium','high'),required:true }, { key:'due_date',label:'Due date',type:'date' }
  ]} render={{ status: row => row['assignee_id'] === a.user?.id && !a.isManager ? <select aria-label={`Status for ${row['title']}`} className="rounded-md border border-input bg-background p-2" value={row['status']} onChange={e => updateStatus(row.id,e.target.value)}>{opts('todo','in_progress','review','done').map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <span className="rounded bg-muted px-2 py-1 text-xs">{String(row['status']).replaceAll('_',' ')}</span> }} /><Button asChild variant="outline"><a href="/app/projects">View projects</a></Button></div>;
}
