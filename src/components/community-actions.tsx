import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function TrainingAction({ id, status }: { id: string; status: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ['registration', id, user?.id], enabled: !!user, queryFn: async () => {
    if (!user) return null;
    const { data, error } = await supabase.from('training_registrations').select('id,status').eq('session_id', id).eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return data;
  } });
  async function register() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('training_registrations').insert({ session_id: id, user_id: user.id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Registration received');
    await qc.invalidateQueries({ queryKey: ['registration', id] });
  }
  if (status !== 'open') return <p className="mt-5 text-sm text-muted-foreground">{status.replaceAll('_',' ')}</p>;
  if (!user) return <Button asChild className="mt-5"><Link to="/auth">Sign in to register</Link></Button>;
  return <Button className="mt-5" disabled={busy || q.isPending || !!q.data || q.isError} onClick={register}>{q.data ? `Registration ${q.data.status}` : busy ? 'Registering…' : 'Register'}</Button>;
}
export function FundingAction({ id, status }: { id: string; status: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ['application', id, user?.id], enabled: !!user, queryFn: async () => {
    if (!user) return null;
    const { data, error } = await supabase.from('funding_applications').select('id,status').eq('opportunity_id',id).eq('user_id',user.id).maybeSingle();
    if (error) throw error;
    return data;
  } });
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.from('funding_applications').insert({ user_id: user.id, opportunity_id: id, business_name: String(form.get('business')), amount_requested: Number(form.get('amount')), proposal: String(form.get('proposal')) });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setOpen(false); toast.success('Application submitted');
    await qc.invalidateQueries({ queryKey: ['application', id] });
  }
  if (status !== 'open') return <p className="mt-5 text-sm text-muted-foreground">Applications closed</p>;
  if (!user) return <Button asChild className="mt-5"><Link to="/auth">Sign in to apply</Link></Button>;
  return <><Button className="mt-5" disabled={q.isPending || !!q.data || q.isError} onClick={() => setOpen(true)}>{q.data ? `Application ${q.data.status}` : 'Apply for funding'}</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Funding application</DialogTitle></DialogHeader><form onSubmit={submit} className="grid gap-4"><div className="grid gap-2"><Label htmlFor="business">Business name</Label><Input id="business" name="business" required /></div><div className="grid gap-2"><Label htmlFor="amount">Amount requested (TSh)</Label><Input id="amount" name="amount" type="number" min="1" required /></div><div className="grid gap-2"><Label htmlFor="proposal">Your proposal</Label><Textarea id="proposal" name="proposal" required rows={5} /></div><Button disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}</Button></form></DialogContent></Dialog></>;
}
