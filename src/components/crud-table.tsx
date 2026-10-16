import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadCsv, logAudit } from "@/lib/auth";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  hideInTable?: boolean;
};

type Row = Record<string, any> & { id: string };

export function CrudTable({
  table,
  title,
  fields,
  canWrite,
  canCreate = canWrite,
  filter,
  defaults,
  render,
  queryKey,
  canEditRow,
}: {
  table: string;
  queryKey?: unknown[];
  canEditRow?: (row: Row) => boolean;
  title: string;
  fields: Field[];
  canWrite: boolean;
  canCreate?: boolean;
  filter?: (q: any) => any;
  defaults?: Record<string, unknown>;
  render?: Record<string, (row: Row) => React.ReactNode>;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: queryKey ?? [table],
    queryFn: async () => {
      let query = (supabase.from(table as any) as any).select("*").order("id");
      if (filter) query = filter(query);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const rows = (q.data ?? []).filter((r) =>
    !search ? true : JSON.stringify(r).toLowerCase().includes(search.toLowerCase()),
  );

  function startNew() {
    setEditing(null);
    setForm({ ...defaults });
    setOpen(true);
  }
  function startEdit(r: Row) {
    setEditing(r);
    setForm(Object.fromEntries(fields.map((f) => [f.key, r[f.key] ?? ""])));
    setOpen(true);
  }

  async function save() {
    for (const f of fields) if (f.required && !String(form[f.key] ?? "").trim()) { toast.error(`${f.label} is required`); return; }
    const payload: Record<string, unknown> = { ...(editing ? {} : defaults) };
    for (const f of fields) {
      const v = form[f.key];
      payload[f.key] = v === "" || v === undefined ? null : f.type === "number" ? Number(v) : v;
    }
    const t = supabase.from(table as any) as any;
    const res = editing ? await t.update(payload).eq("id", editing.id).select().single() : await t.insert(payload).select().single();
    if (res.error) { toast.error(res.error.message); return; }
    await logAudit(editing ? "update" : "create", table, res.data?.id);
    toast.success("Saved");
    setOpen(false);
    qc.invalidateQueries({ queryKey: [table] });
  }

  async function remove(r: Row) {
    if (!confirm("Delete this record?")) return;
    const { error } = await (supabase.from(table as any) as any).delete().eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    await logAudit("delete", table, r.id);
    qc.invalidateQueries({ queryKey: [table] });
  }

  const cols = fields.filter((f) => !f.hideInTable);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <div className="flex gap-2">
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          <Button variant="outline" onClick={() => downloadCsv(table, rows)}><Download className="h-4 w-4" />CSV</Button>
          {canCreate && <Button onClick={startNew}><Plus className="h-4 w-4" />Add</Button>}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {cols.map((c) => <TableHead key={c.key}>{c.label}</TableHead>)}
              {canWrite && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isError && <TableRow><TableCell colSpan={cols.length + 1} role="alert">Unable to load records. Please try again.</TableCell></TableRow>}
            {q.isLoading && <TableRow><TableCell colSpan={cols.length + 1}>Loading…</TableCell></TableRow>}
            {!q.isLoading && !q.isError && rows.length === 0 && (
              <TableRow><TableCell colSpan={cols.length + 1} className="text-muted-foreground">No records yet.</TableCell></TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                {cols.map((c) => (
                  <TableCell key={c.key} className="max-w-xs truncate">
                    {render?.[c.key]?.(r) ?? c.options?.find((o) => o.value === r[c.key])?.label ?? String(r[c.key] ?? "—")}
                  </TableCell>
                ))}
                {canWrite && (
                  <TableCell className="space-x-1 text-right">
                    <Button disabled={canEditRow ? !canEditRow(r) : false} size="icon" variant="ghost" onClick={() => startEdit(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button disabled={canEditRow ? !canEditRow(r) : false} size="icon" variant="ghost" onClick={() => remove(r)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} record</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            {fields.map((f) => (
              <div key={f.key} className="grid gap-1.5">
                <Label htmlFor={f.key}>{f.label}{f.required && " *"}</Label>
                {f.type === "textarea" ? (
                  <Textarea id={f.key} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                ) : f.type === "select" ? (
                  <select id={f.key} className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                    <option value="">—</option>
                    {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <Input id={f.key} type={f.type ?? "text"} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                )}
              </div>
            ))}
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const opts = (...v: string[]) => v.map((x) => ({ value: x, label: x.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) }));
