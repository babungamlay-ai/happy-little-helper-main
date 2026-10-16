import { pageMeta } from "@/lib/page-meta";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { CrudTable, opts } from "@/components/crud-table";

export const Route = createFileRoute("/_authenticated/app/funding")({
  head: () => pageMeta("Funding opportunities — TDSP Portal", "Funding opportunities in the TDSP portal."),
  component: Page,
});

function Page() {
  const a = useAuth();
  return (
    <div className="space-y-12">
      <section>
        <p className="mb-2 text-sm text-muted-foreground">Publish and update available support for community businesses.</p>
        <CrudTable table="funding_opportunities" title="Funding opportunities" canWrite={a.isManager} fields={[
          { key: "title", label: "Title", required: true },
          { key: "funder", label: "Funder" },
          { key: "amount", label: "Amount (TSh)", type: "number" },
          { key: "deadline", label: "Deadline", type: "date" },
          { key: "status", label: "Status", type: "select", options: opts("open", "closed") },
        ]} />
      </section>
      <section>
        <p className="mb-4 text-sm text-muted-foreground">Review submitted requests and update each applicant on the decision.</p>
        <CrudTable table="funding_applications" title="Applications to review" canWrite={a.isManager} canCreate={false} fields={[
          { key: "business_name", label: "Business" },
          { key: "amount_requested", label: "Requested (TSh)", type: "number" },
          { key: "proposal", label: "Proposal", type: "textarea", hideInTable: true },
          { key: "status", label: "Status", type: "select", options: opts("submitted", "approved", "rejected"), required: true },
          { key: "created_at", label: "Submitted" },
        ]} />
      </section>
    </div>
  );
}
