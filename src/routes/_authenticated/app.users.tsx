import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Trash2, Plus, ShieldCheck, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, ROLE_LABELS, type Role } from '@/lib/auth';
import { useDirectory } from '@/lib/portal-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pageMeta } from '@/lib/page-meta';
export const Route = createFileRoute('/_authenticated/app/users')({ head: () => pageMeta('Users & roles — TDSP Portal','Manage TDSP member access.'), component: Page });
function Page() {
  const a = useAuth();
  const qc = useQueryClient();
  const directory = useDirectory(a.isAdmin);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<Role>('beneficiary');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ['user_roles'],
    enabled: a.isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });
  const filteredRoles = useMemo(() => {
    const members = directory.data?.people ?? [];
    const query = search.trim().toLowerCase();
    return (q.data ?? []).filter((memberRole) => {
      const person = members.find((item) => item.value === memberRole.user_id);
      return !query || person?.label.toLowerCase().includes(query) || ROLE_LABELS[memberRole.role].toLowerCase().includes(query);
    });
  }, [directory.data?.people, q.data, search]);
  const superAdminCount = (q.data ?? []).filter((item) => item.role === 'super_admin').length;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    if (q.data?.some((item) => item.user_id === userId && item.role === role)) {
      toast.error('This member already has that role.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Role added');
    setUserId('');
    await qc.invalidateQueries({ queryKey: ['user_roles'] });
  }

  async function remove(id: string) {
    if (!confirm('Remove this role?')) return;
    const { error } = await supabase.from('user_roles').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Role removed');
    await qc.invalidateQueries({ queryKey: ['user_roles'] });
  }

  if(!a.rolesLoaded) return <p>Loading access…</p>;
  if(!a.isAdmin) return <p role="alert">Administrator access required.</p>;
  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="text-3xl">Users & roles</h1>
        </div>
        <p className="mt-2 text-muted-foreground">Assign the minimum access each member needs.</p>
      </header>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Add a role</h2>
        <form onSubmit={add} className="mt-4 flex flex-wrap gap-3">
          <select required aria-label="Member" value={userId} onChange={(event) => setUserId(event.target.value)} className="h-10 min-w-48 rounded-md border border-input bg-background px-3">
            <option value="">Choose a member</option>
            {directory.data?.people.map((person) => <option key={person.value} value={person.value}>{person.label}</option>)}
          </select>
          <select aria-label="Role" value={role} onChange={(event) => setRole(event.target.value as Role)} className="h-10 rounded-md border border-input bg-background px-3">
            {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <Button disabled={busy || !userId || q.isPending}><Plus className="h-4 w-4" />{busy ? 'Adding…' : 'Add role'}</Button>
        </form>
        {directory.isError && <p role="alert" className="mt-3 text-sm text-destructive">Unable to load members. Please refresh and try again.</p>}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Assigned roles</h2>
            <p className="mt-1 text-sm text-muted-foreground">{q.data?.length ?? 0} role assignments · {superAdminCount} super administrator(s)</p>
          </div>
          <label className="relative block w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search members and roles" placeholder="Search members or roles…" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
          </label>
        </div>
        {q.isError && <p role="alert" className="border-y border-border py-5 text-destructive">Unable to load role assignments.</p>}
        {q.isPending && <p className="border-y border-border py-5 text-muted-foreground">Loading role assignments…</p>}
        {!q.isPending && !q.isError && filteredRoles.length === 0 && (
          <p className="border-y border-border py-5 text-muted-foreground">{search ? 'No assignments match your search.' : 'No roles assigned yet.'}</p>
        )}
        <div className="divide-y divide-border border-y border-border">
          {filteredRoles.map((memberRole) => {
            const memberName = directory.data?.people.find((person) => person.value === memberRole.user_id)?.label ?? 'Member';
            const protectsLastAdmin = memberRole.role === 'super_admin' && superAdminCount <= 1;
            return (
              <div key={memberRole.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">{memberName}{memberRole.user_id === a.user?.id ? ' (you)' : ''}</p>
                  <p className="text-sm text-muted-foreground">{ROLE_LABELS[memberRole.role]}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={protectsLastAdmin}
                  aria-label={`Remove ${ROLE_LABELS[memberRole.role]} role from ${memberName}`}
                  title={protectsLastAdmin ? 'The last super administrator role cannot be removed here.' : 'Remove role'}
                  onClick={() => remove(memberRole.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
