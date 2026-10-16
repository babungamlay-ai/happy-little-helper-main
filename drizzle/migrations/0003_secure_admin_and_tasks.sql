-- Public signups must never grant privileged roles.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));

  insert into public.user_roles (user_id, role)
  values (new.id, 'beneficiary');

  return new;
end $$;

-- Assignees may change task status, but not reassign or rewrite the task.
drop policy if exists "managers or assignee update" on public.tasks;
create policy "managers or assignee update" on public.tasks
for update to authenticated
using (public.is_manager(auth.uid()) or assignee_id = auth.uid())
with check (public.is_manager(auth.uid()) or assignee_id = auth.uid());

create or replace function public.enforce_assignee_task_status_update()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_manager(auth.uid()) then
    if old.assignee_id is distinct from auth.uid()
      or new.id is distinct from old.id
      or new.project_id is distinct from old.project_id
      or new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.assignee_id is distinct from old.assignee_id
      or new.priority is distinct from old.priority
      or new.due_date is distinct from old.due_date
      or new.created_by is distinct from old.created_by
      or new.created_at is distinct from old.created_at
      or new.status not in ('todo', 'in_progress', 'review', 'done') then
      raise exception 'Assignees may only update their task status';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists enforce_assignee_task_status_update on public.tasks;
create trigger enforce_assignee_task_status_update
before update on public.tasks
for each row execute function public.enforce_assignee_task_status_update();
