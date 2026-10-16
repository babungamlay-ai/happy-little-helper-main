import { pageMeta } from "@/lib/page-meta";
import { createFileRoute } from "@tanstack/react-router";
import { CrudTable, opts } from "@/components/crud-table";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/app/notifications")({
  head: () => pageMeta("Notifications — TDSP Portal", "Notifications in the TDSP portal."),
  component: Page,
});

function Page() {
  const a = useAuth();
  void opts;
  return <CrudTable table="notifications" title="Notifications" canWrite={false} fields={[{ key: "title", label: "Title" }, { key: "body", label: "Message" }, { key: "created_at", label: "When" }]} />;
}
