import { createFileRoute } from '@tanstack/react-router';
import { LeadershipDashboard } from '@/components/leadership-dashboard';
import { MemberDashboard } from '@/components/member-dashboard';
import { useAuth } from '@/lib/auth';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/_authenticated/app/dashboard')({
  head: () => pageMeta('Dashboard — TDSP Portal', 'TDSP programs, beneficiaries, training and funding overview.'),
  component: Dashboard,
});

function Dashboard() {
  const auth = useAuth();

  if (!auth.rolesLoaded) return <p>Loading access…</p>;

  if (auth.canViewOps || auth.canViewReports) {
    return <LeadershipDashboard />;
  }

  return <MemberDashboard />;
}
