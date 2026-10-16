import { pageMeta } from "@/lib/page-meta";
import { createFileRoute } from "@tanstack/react-router";
import { CrudTable, opts } from "@/components/crud-table";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/app/audit")({
  head: () => pageMeta("Audit log — TDSP Portal", "Audit log in the TDSP portal."),
  component: Page,
});

function Page() {
  const a = useAuth();
  void opts;
  return <CrudTable table="audit_logs" title="Audit log" canWrite={false} fields={[{ key: "action", label: "Action" }, { key: "entity", label: "Entity" }, { key: "created_at", label: "When" }]} />;
}
