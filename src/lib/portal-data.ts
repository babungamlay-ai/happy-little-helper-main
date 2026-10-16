import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
export function useDirectory(enabled = true) {
  return useQuery({ queryKey: ['directory'], enabled, queryFn: async () => {
    const [people, projects, programs] = await Promise.all([supabase.from('profiles').select('id,full_name'), supabase.from('projects').select('id,name'), supabase.from('programs').select('id,name')]);
    if (people.error || projects.error || programs.error) throw new Error('Unable to load people and projects.');
    return { people: (people.data ?? []).map(p => ({ value: p.id, label: p.full_name || `Member ${p.id.slice(0,8)}` })), projects: (projects.data ?? []).map(p => ({ value: p.id, label: p.name })), programs: (programs.data ?? []).map(p => ({ value: p.id, label: p.name })) };
  } });
}
