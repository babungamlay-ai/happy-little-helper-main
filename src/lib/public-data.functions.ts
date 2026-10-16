import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export const getPublicData = createServerFn({ method: 'GET' }).handler(async () => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  const url = process.env['SUPABASE_URL'];
  if (!key || !url) throw new Error('Community opportunities are temporarily unavailable.');
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key);
    return fetch(input, { ...init, headers });
  } } });
  const [programs, trainings, funding, marketplace] = await Promise.all([
    client.from('programs').select('id,name,description,focus_area,status').order('created_at', { ascending: false }),
    client.from('training_sessions').select('id,title,description,trainer,location,start_date,capacity,status').order('start_date'),
    client.from('funding_opportunities').select('id,title,description,funder,amount,deadline,status').order('deadline'),
    client.from('market_listings').select('id,title,description,category,price,unit,location,contact').eq('status','active').order('created_at', { ascending: false }),
  ]);
  if ([programs, trainings, funding, marketplace].some(r => r.error)) throw new Error('Unable to load community opportunities. Please try again.');
  return { programs: programs.data ?? [], trainings: trainings.data ?? [], funding: funding.data ?? [], marketplace: marketplace.data ?? [] };
});
