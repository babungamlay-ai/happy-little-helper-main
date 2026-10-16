import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight, GraduationCap, HandCoins } from 'lucide-react';
import { TaskWorkspace } from '@/components/task-workspace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { publicDataOptions } from '@/lib/public-data';

export function MemberDashboard() {
  const auth = useAuth();
  const userId = auth.user?.id;
  const opportunities = useQuery(publicDataOptions);
  const applications = useQuery({
    queryKey: ['my-funding-applications', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error('Sign in to view your funding applications.');
      const { data, error } = await supabase
        .from('funding_applications')
        .select('id, business_name, status, amount_requested, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const registrations = useQuery({
    queryKey: ['my-training-registrations', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error('Sign in to view your training registrations.');
      const { data, error } = await supabase
        .from('training_registrations')
        .select('id, session_id, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const trainingTitles = new Map((opportunities.data?.trainings ?? []).map((item) => [item.id, item.title]));
  const hasError = applications.isError || registrations.isError;

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Member portal</p>
        <h1 className="mt-2 text-3xl font-semibold">My opportunities</h1>
        <p className="mt-2 text-muted-foreground">Track your training registrations and funding applications.</p>
      </header>

      {hasError && (
        <p role="alert" className="rounded-md border border-destructive/40 p-4 text-sm text-destructive">
          Some of your activity could not be loaded. Please refresh and try again.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HandCoins className="h-5 w-5 text-primary" />Funding applications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {applications.isPending ? <p className="text-sm text-muted-foreground">Loading applications…</p> : null}
            {applications.data?.map((application) => (
              <div key={application.id} className="flex items-start justify-between gap-4 border-t border-border pt-3">
                <div>
                  <p className="font-medium">{application.business_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    TSh {(application.amount_requested ?? 0).toLocaleString()} · {new Date(application.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs capitalize">{application.status.replaceAll('_', ' ')}</span>
              </div>
            ))}
            {!applications.isPending && !applications.isError && applications.data?.length === 0 && (
              <p className="border-t border-border pt-3 text-sm text-muted-foreground">You have not applied for funding yet.</p>
            )}
            <Link to="/funding" className="inline-flex items-center gap-2 pt-2 text-sm font-medium text-primary">
              Browse funding opportunities <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" />Training registrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {registrations.isPending ? <p className="text-sm text-muted-foreground">Loading registrations…</p> : null}
            {registrations.data?.map((registration) => (
              <div key={registration.id} className="flex items-start justify-between gap-4 border-t border-border pt-3">
                <div>
                  <p className="font-medium">{trainingTitles.get(registration.session_id) ?? 'Training session'}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Registered {new Date(registration.created_at).toLocaleDateString()}</p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs capitalize">{registration.status.replaceAll('_', ' ')}</span>
              </div>
            ))}
            {!registrations.isPending && !registrations.isError && registrations.data?.length === 0 && (
              <p className="border-t border-border pt-3 text-sm text-muted-foreground">You have not registered for training yet.</p>
            )}
            <Link to="/trainings" className="inline-flex items-center gap-2 pt-2 text-sm font-medium text-primary">
              Browse training sessions <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <TaskWorkspace mine />
    </div>
  );
}
