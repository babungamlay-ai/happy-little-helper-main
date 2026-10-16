import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight, ClipboardList, FolderKanban, HandCoins, Users, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function LeadershipDashboard() {
  const auth = useAuth();
  const query = useQuery({
    queryKey: ['leadership-dashboard', auth.user?.id, auth.canViewOps, auth.canViewReports],
    enabled: auth.rolesLoaded && (auth.canViewOps || auth.canViewReports),
    queryFn: async () => {
      const [projects, beneficiaries, trainingRegistrations, pendingApplications, tasks] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('beneficiaries').select('id', { count: 'exact', head: true }),
        supabase.from('training_registrations').select('id', { count: 'exact', head: true }),
        auth.canViewReports
          ? supabase.from('funding_applications').select('id', { count: 'exact', head: true }).eq('status', 'submitted')
          : Promise.resolve({ count: 0, error: null }),
        auth.canViewOps
          ? supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'in_progress')
          : Promise.resolve({ count: 0, error: null }),
      ]);

      const error = projects.error ?? beneficiaries.error ?? trainingRegistrations.error ?? pendingApplications.error ?? tasks.error;
      if (error) throw new Error('Unable to load dashboard figures.');

      return {
        activeProjects: projects.count ?? 0,
        beneficiaries: beneficiaries.count ?? 0,
        trainingRegistrations: trainingRegistrations.count ?? 0,
        pendingApplications: pendingApplications.count ?? 0,
        tasksInProgress: tasks.count ?? 0,
      };
    },
  });

  const metrics = [
    { label: 'Active projects', value: query.data?.activeProjects, icon: FolderKanban },
    { label: 'Beneficiaries', value: query.data?.beneficiaries, icon: Users },
    { label: 'Training registrations', value: query.data?.trainingRegistrations, icon: GraduationCap },
    ...(auth.canViewReports
      ? [{ label: 'Funding applications to review', value: query.data?.pendingApplications, icon: HandCoins }]
      : []),
    ...(auth.canViewOps
      ? [{ label: 'Tasks in progress', value: query.data?.tasksInProgress, icon: ClipboardList }]
      : []),
  ];
  const fundingWorkspace = auth.canViewReports
    ? {
        label: 'Funding applications',
        to: auth.isManager ? ('/app/funding' as const) : ('/app/reports' as const),
      }
    : null;

  if (!auth.rolesLoaded) return <p>Loading access…</p>;
  if (query.isError) return <p role="alert">Unable to load dashboard figures. Please try again later.</p>;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">TDSP overview</p>
        <h1 className="mt-2 text-3xl font-semibold">Management dashboard</h1>
        <p className="mt-2 text-muted-foreground">A snapshot of programs and community activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{query.isPending ? '—' : value?.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Go to a workspace</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ...(auth.canViewOps ? [{ label: 'Projects & programs', to: '/app/projects' as const }] : []),
            ...(auth.canViewOps ? [{ label: 'Beneficiaries', to: '/app/beneficiaries' as const }] : []),
            ...(fundingWorkspace ? [fundingWorkspace] : []),
            { label: 'Trainings', to: '/app/trainings' as const },
            ...(auth.canViewOps ? [{ label: 'Team tasks', to: '/app/tasks' as const }] : []),
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 text-sm font-medium transition-colors hover:border-primary"
            >
              {item.label}
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
