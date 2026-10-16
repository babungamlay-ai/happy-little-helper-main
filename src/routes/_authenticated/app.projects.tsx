import { pageMeta } from "@/lib/page-meta";
import { createFileRoute } from "@tanstack/react-router";
import { CrudTable, opts } from "@/components/crud-table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDirectory } from "@/lib/portal-data";
import { projectProgress } from "@/lib/progress";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/app/projects")({
  head: () => pageMeta("Projects — TDSP Portal", "Projects in the TDSP portal."),
  component: Page,
});

function Page() {
  const a = useAuth();
  const directory = useDirectory();
  const tasks = useQuery({ queryKey: ["task-summary",a.user?.id], queryFn: async () => { const { data,error } = await supabase.from("tasks").select("status,project_id"); if(error) throw error; return data ?? []; } });
  return <CrudTable table="projects" title="Projects" canWrite={a.isManager} defaults={{ status: "planned", beneficiaries_reached: 0 }} render={{ name: row => { const p = projectProgress(tasks.data ?? [],row.id); return <div className="min-w-40"><p className="font-medium">{row['name']}</p><progress className="mt-2 h-2 w-full accent-primary" max={100} value={p.percent} aria-label={`Progress for ${row['name']}`} /><p className="text-xs text-muted-foreground">{p.completed}/{p.total} tasks · {p.percent}%</p></div>; } }} fields={[{ key: "name", label: "Name", required: true }, { key: "program_id", label: "Program", type: "select", options: directory.data?.programs ?? [] }, { key: "location", label: "Location" }, { key: "budget", label: "Budget (TSh)", type: "number" }, { key: "start_date", label: "Start", type: "date" }, { key: "end_date", label: "End", type: "date" }, { key: "status", label: "Status", type: "select", options: opts("planned","active","completed") }, { key: "beneficiaries_reached", label: "Reached", type: "number" }]} />;
}
