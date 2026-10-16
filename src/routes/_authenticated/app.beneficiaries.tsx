import { pageMeta } from "@/lib/page-meta";
import { createFileRoute } from "@tanstack/react-router";
import { CrudTable, opts } from "@/components/crud-table";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/app/beneficiaries")({
  head: () => pageMeta("Beneficiaries — TDSP Portal", "Beneficiaries in the TDSP portal."),
  component: Page,
});

function Page() {
  const a = useAuth();
  void opts;
  return <CrudTable table="beneficiaries" title="Beneficiaries" canWrite={a.isManager} fields={[{ key: "full_name", label: "Full name", required: true }, { key: "gender", label: "Gender", type: "select", options: opts("female","male") }, { key: "age", label: "Age", type: "number" }, { key: "phone", label: "Phone" }, { key: "region", label: "Region" }, { key: "district", label: "District" }, { key: "category", label: "Category" }, { key: "skills", label: "Skills", hideInTable: true }]} />;
}
