import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, downloadCsv } from '@/lib/auth';
import { CrudTable, opts } from '@/components/crud-table';
import { Button } from '@/components/ui/button';
import { pageMeta } from '@/lib/page-meta';
export const Route = createFileRoute('/_authenticated/app/reports')({head:()=>pageMeta('Impact & reports — TDSP Portal','TDSP project impact and funding reports.'),component:Page});
function Page(){
 const a=useAuth();
 const q=useQuery({queryKey:['impact-report'],enabled:a.canViewReports,queryFn:async()=>{
  const [projects,beneficiaries,registrations,applications]=await Promise.all([supabase.from('projects').select('*'),supabase.from('beneficiaries').select('id'),supabase.from('training_registrations').select('id,status'),supabase.from('funding_applications').select('id,status,amount_requested')]);
  if(projects.error||beneficiaries.error||registrations.error||applications.error)throw new Error('Unable to load impact report.');
  return {projects:projects.data??[],beneficiaries:beneficiaries.data??[],registrations:registrations.data??[],applications:applications.data??[]};
 }});
 if(!a.rolesLoaded)return <p>Loading access…</p>;
 if(!a.canViewReports)return <p role="alert">Report access required.</p>;
 const metrics=[{metric:'Projects',value:q.data?.projects.length??0},{metric:'Beneficiaries registered',value:q.data?.beneficiaries.length??0},{metric:'People reached',value:q.data?.projects.reduce((n,p)=>n+p.beneficiaries_reached,0)??0},{metric:'Training registrations',value:q.data?.registrations.length??0},{metric:'Funding approved (TSh)',value:q.data?.applications.filter(p=>p.status==='approved').reduce((n,p)=>n+(p.amount_requested??0),0)??0}];
 return <div className="space-y-10"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl">Impact & reports</h1><Button variant="outline" disabled={!q.data} onClick={()=>downloadCsv('tdsp-impact',metrics)}><Download className="h-4 w-4" />Export impact</Button></div>{q.isError?<p role="alert">Unable to load impact figures.</p>:<div className="grid grid-cols-2 gap-6 border-y border-border py-7 lg:grid-cols-5">{metrics.map(m=><div key={m.metric}><p className="text-3xl font-semibold">{q.isPending?'—':m.value.toLocaleString()}</p><p className="mt-2 text-sm text-muted-foreground">{m.metric}</p></div>)}</div>}<CrudTable table="funding_applications" title="Funding applications" canWrite={a.isManager} canCreate={false} fields={[{key:'business_name',label:'Business'},{key:'amount_requested',label:'Requested (TSh)',type:'number'},{key:'proposal',label:'Proposal',type:'textarea',hideInTable:true},{key:'status',label:'Status',type:'select',options:opts('submitted','approved','rejected'),required:true}]} /></div>;
}
