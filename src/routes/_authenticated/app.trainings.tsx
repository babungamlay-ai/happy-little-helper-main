import { pageMeta } from "@/lib/page-meta";
import { createFileRoute } from "@tanstack/react-router";
import { CrudTable, opts } from "@/components/crud-table";
import { useAuth } from "@/lib/auth";
import { useDirectory } from "@/lib/portal-data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/trainings")({
  head: () => pageMeta("Trainings — TDSP Portal", "Trainings in the TDSP portal."),
  component: Page,
});

function Page() {
  const a = useAuth();
  const directory = useDirectory(a.isManager);
  const sessions = useQuery({
    queryKey: ["training-session-options"],
    enabled: a.isManager,
    queryFn: async () => {
      const { data, error } = await supabase.from("training_sessions").select("id,title").order("title");
      if (error) throw error;
      return (data ?? []).map((session) => ({ value: session.id, label: session.title }));
    },
  });

  return (
    <div className="space-y-12">
      <section>
        <p className="mb-2 text-sm text-muted-foreground">Manage sessions and publish training opportunities.</p>
        <CrudTable table="training_sessions" title="Training sessions" canWrite={a.isManager} fields={[
          { key: "title", label: "Title", required: true },
          { key: "trainer", label: "Trainer" },
          { key: "location", label: "Location" },
          { key: "start_date", label: "Start", type: "date" },
          { key: "capacity", label: "Capacity", type: "number" },
          { key: "status", label: "Status", type: "select", options: opts("open", "closed", "completed") },
          { key: "description", label: "Description", type: "textarea", hideInTable: true },
        ]} />
      </section>
      {a.isManager && (
        <section>
          <p className="mb-4 text-sm text-muted-foreground">View registrations and update attendance or completion status.</p>
          <CrudTable table="training_registrations" title="Training registrations" canWrite canCreate={false} queryKey={["training-registrations"]} fields={[
            { key: "session_id", label: "Training", type: "select", options: sessions.data },
            { key: "user_id", label: "Participant", type: "select", options: directory.data?.people },
            { key: "status", label: "Status", type: "select", options: opts("registered", "attended", "completed", "cancelled"), required: true },
            { key: "created_at", label: "Registered" },
          ]} />
        </section>
      )}
    </div>
  );
}
