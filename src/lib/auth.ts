import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Role = Database["public"]["Enums"]["app_role"];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Administrator",
  executive_director: "Executive Director",
  program_manager: "Program Manager",
  field_officer: "Field Officer",
  beneficiary: "Registered Beneficiary",
  partner: "Partner",
};

export const MANAGER_ROLES: Role[] = ["super_admin", "program_manager", "field_officer"];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const rolesQ = useQuery({
    queryKey: ["my-roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role);
    },
  });
  const roles = rolesQ.data ?? [];
  const has = (r: Role[]) => roles.some((x) => r.includes(x));
  return {
    user,
    ready,
    roles,
    rolesLoaded: !user || rolesQ.isFetched,
    isAdmin: roles.includes("super_admin"),
    isManager: has(MANAGER_ROLES),
    canViewReports: has(["super_admin", "executive_director", "program_manager", "partner"]),
    canViewOps: has([...MANAGER_ROLES, "executive_director"]),
  };
}

export async function logAudit(action: string, entity: string, entityId?: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("audit_logs").insert({ action, entity, entity_id: entityId ?? null, user_id: data.user.id });
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const first = rows[0];
  if (!first) return "";
  const keys = Object.keys(first);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}

export function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.csv`;
  a.click();
}
