import { pageMeta } from "@/lib/page-meta";
import { createFileRoute } from "@tanstack/react-router";
import { CrudTable, opts } from "@/components/crud-table";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/app/partners")({
  head: () => pageMeta("Partners — TDSP Portal", "Partners in the TDSP portal."),
  component: Page,
});

function Page() {
  const a = useAuth();
  void opts;
  return <CrudTable table="partners" title="Partners" canWrite={a.isAdmin} fields={[{ key: "name", label: "Name", required: true }, { key: "type", label: "Type" }, { key: "contact_email", label: "Email" }, { key: "website", label: "Website" }]} />;
}
