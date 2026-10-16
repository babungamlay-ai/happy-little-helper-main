create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  title text not null, description text,
  assignee_id uuid,
  status text not null default 'todo',
  priority text not null default 'medium',
  due_date date,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;
create policy "staff or assignee read" on public.tasks for select to authenticated using (public.is_manager(auth.uid()) or public.has_role(auth.uid(),'executive_director') or assignee_id = auth.uid());
create policy "managers create" on public.tasks for insert to authenticated with check (public.is_manager(auth.uid()));
create policy "managers or assignee update" on public.tasks for update to authenticated using (public.is_manager(auth.uid()) or assignee_id = auth.uid());
create policy "managers delete" on public.tasks for delete to authenticated using (public.is_manager(auth.uid()));
create or replace function public.notify_task_assigned()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.assignee_id is not null and (tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id) then
    insert into public.notifications (user_id, title, body) values (new.assignee_id, 'New task assigned', new.title);
  end if;
  return new;
end $$;
create trigger task_assigned after insert or update on public.tasks for each row execute function public.notify_task_assigned();