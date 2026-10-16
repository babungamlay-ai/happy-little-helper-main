import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell, BookOpen, ClipboardList, FileBarChart, FolderKanban, HandCoins, LayoutDashboard, Leaf, LogOut,
  ScrollText, ShoppingBasket, Shield, Users, Handshake,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: PortalShell,
});

function PortalShell() {
  const auth = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const items = [
    { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { to: "/app/tasks", label: "Tasks", icon: ClipboardList, show: auth.canViewOps || auth.roles.length > 0 },
    { to: "/app/projects", label: "Programs & projects", icon: FolderKanban, show: auth.canViewOps },
    { to: "/app/beneficiaries", label: "Beneficiaries", icon: Users, show: auth.canViewOps },
    { to: "/app/trainings", label: "Trainings", icon: BookOpen, show: true },
    { to: "/app/funding", label: "Funding", icon: HandCoins, show: true },
    { to: "/app/marketplace", label: "Marketplace", icon: ShoppingBasket, show: true },
    { to: "/app/partners", label: "Partners", icon: Handshake, show: auth.isAdmin },
    { to: "/app/reports", label: "Impact & reports", icon: FileBarChart, show: auth.canViewReports },
    { to: "/app/users", label: "Users & roles", icon: Shield, show: auth.isAdmin },
    { to: "/app/audit", label: "Audit log", icon: ScrollText, show: auth.isAdmin || auth.roles.includes("executive_director") },
    { to: "/app/notifications", label: "Notifications", icon: Bell, show: true },
  ] as const;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <Link to="/" className="flex items-center gap-2 px-5 py-5">
          <Leaf className="h-6 w-6 text-sidebar-primary" />
          <span className="font-display text-xl">TDSP Portal</span>
        </Link>
        <nav className="flex-1 space-y-0.5 px-3">
          {items.filter((i) => i.show).map((i) => (
            <Link key={i.to} to={i.to} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-primary font-semibold" }}>
              <i.icon className="h-4 w-4" />{i.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-xs">
          <p className="truncate font-medium">{auth.user?.email}</p>
          <p className="opacity-70">{auth.roles.map((r) => ROLE_LABELS[r]).join(", ")}</p>
          <button onClick={signOut} className="mt-3 flex items-center gap-2 opacity-80 hover:opacity-100"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      </aside>
      <div className="flex-1">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-sidebar p-2 text-sidebar-foreground md:hidden">
          {items.filter((i) => i.show).map((i) => (
            <Link key={i.to} to={i.to} className="whitespace-nowrap rounded px-2 py-1 text-xs" activeProps={{ className: "bg-sidebar-accent" }}>{i.label}</Link>
          ))}
          <button onClick={signOut} className="px-2 text-xs">Sign out</button>
        </div>
        <main className="mx-auto max-w-6xl p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
