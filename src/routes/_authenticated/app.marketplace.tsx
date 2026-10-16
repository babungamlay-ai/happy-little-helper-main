import { pageMeta } from "@/lib/page-meta";
import { createFileRoute } from "@tanstack/react-router";
import { CrudTable, opts } from "@/components/crud-table";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/app/marketplace")({
  head: () => pageMeta("Marketplace listings — TDSP Portal", "Marketplace listings in the TDSP portal."),
  component: Page,
});

function Page() {
  const a = useAuth();
  void opts;
  return <CrudTable table="market_listings" title="Marketplace listings" canWrite={a.isManager} fields={[{ key: "title", label: "Title", required: true }, { key: "category", label: "Category" }, { key: "price", label: "Price", type: "number" }, { key: "unit", label: "Unit" }, { key: "location", label: "Location" }, { key: "contact", label: "Contact" }]} />;
}
