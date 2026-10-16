create type public.app_role as enum ('super_admin','executive_director','program_manager','field_officer','beneficiary','partner');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text, region text,
  created_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;
create or replace function public.has_any_role(_user_id uuid, _roles app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role = any(_roles))
$$;
-- staff that manage operations
create or replace function public.is_manager(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(_uid, array['super_admin','program_manager','field_officer']::app_role[])
$$;
create or replace function public.can_view_reports(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(_uid, array['super_admin','executive_director','program_manager','partner']::app_role[])
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_manager(auth.uid()) or public.has_role(auth.uid(),'executive_director'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "read own roles or admin" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "admin add roles" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(),'super_admin'));
create policy "admin remove roles" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(),'super_admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  if not exists (select 1 from public.user_roles where role='super_admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'beneficiary');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Programs & projects
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text, focus_area text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete set null,
  name text not null, location text, budget numeric default 0,
  start_date date, end_date date, status text not null default 'planned',
  beneficiaries_reached int not null default 0,
  created_at timestamptz not null default now()
);
create table public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  full_name text not null, gender text, age int, phone text,
  region text, district text, category text, skills text,
  status text not null default 'active',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text, trainer text, location text,
  start_date date, capacity int default 30,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
create table public.training_registrations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  status text not null default 'registered',
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);
create table public.funding_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text, funder text,
  amount numeric default 0, deadline date,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
create table public.funding_applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.funding_opportunities(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  business_name text not null, proposal text, amount_requested numeric default 0,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);
create table public.market_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null, description text, category text,
  price numeric default 0, unit text, location text, contact text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null, type text, contact_email text, website text, description text,
  created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, title text not null, body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(), action text not null, entity text, entity_id uuid,
  created_at timestamptz not null default now()
);

grant select on public.programs, public.projects, public.training_sessions, public.funding_opportunities, public.market_listings, public.partners to anon;
grant select, insert, update, delete on public.programs, public.projects, public.beneficiaries, public.training_sessions, public.training_registrations, public.funding_opportunities, public.funding_applications, public.market_listings, public.partners, public.notifications to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant all on public.programs, public.projects, public.beneficiaries, public.training_sessions, public.training_registrations, public.funding_opportunities, public.funding_applications, public.market_listings, public.partners, public.notifications, public.audit_logs to service_role;

alter table public.programs enable row level security;
alter table public.projects enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_registrations enable row level security;
alter table public.funding_opportunities enable row level security;
alter table public.funding_applications enable row level security;
alter table public.market_listings enable row level security;
alter table public.partners enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- public catalogs
create policy "public read" on public.programs for select to anon, authenticated using (true);
create policy "managers write" on public.programs for all to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));
create policy "public read" on public.projects for select to anon, authenticated using (true);
create policy "managers write" on public.projects for all to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));
create policy "public read" on public.training_sessions for select to anon, authenticated using (true);
create policy "managers write" on public.training_sessions for all to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));
create policy "public read" on public.funding_opportunities for select to anon, authenticated using (true);
create policy "managers write" on public.funding_opportunities for all to authenticated using (public.is_manager(auth.uid())) with check (public.is_manager(auth.uid()));
create policy "public read" on public.partners for select to anon, authenticated using (true);
create policy "admin write" on public.partners for all to authenticated using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

-- beneficiaries
create policy "staff or self read" on public.beneficiaries for select to authenticated using (public.is_manager(auth.uid()) or public.has_role(auth.uid(),'executive_director') or user_id = auth.uid());
create policy "staff insert" on public.beneficiaries for insert to authenticated with check (public.is_manager(auth.uid()) or user_id = auth.uid());
create policy "staff update" on public.beneficiaries for update to authenticated using (public.is_manager(auth.uid()) or user_id = auth.uid());
create policy "staff delete" on public.beneficiaries for delete to authenticated using (public.is_manager(auth.uid()));

-- registrations
create policy "own or staff read" on public.training_registrations for select to authenticated using (user_id = auth.uid() or public.is_manager(auth.uid()));
create policy "self register" on public.training_registrations for insert to authenticated with check (user_id = auth.uid());
create policy "staff update" on public.training_registrations for update to authenticated using (public.is_manager(auth.uid()));
create policy "own or staff delete" on public.training_registrations for delete to authenticated using (user_id = auth.uid() or public.is_manager(auth.uid()));

-- funding applications
create policy "own or staff read" on public.funding_applications for select to authenticated using (user_id = auth.uid() or public.is_manager(auth.uid()) or public.has_role(auth.uid(),'executive_director'));
create policy "self apply" on public.funding_applications for insert to authenticated with check (user_id = auth.uid());
create policy "staff update" on public.funding_applications for update to authenticated using (public.is_manager(auth.uid()));
create policy "staff delete" on public.funding_applications for delete to authenticated using (public.is_manager(auth.uid()));

-- marketplace
create policy "public read active" on public.market_listings for select to anon, authenticated using (status = 'active' or user_id = auth.uid() or public.is_manager(auth.uid()));
create policy "own create" on public.market_listings for insert to authenticated with check (user_id = auth.uid());
create policy "own or staff update" on public.market_listings for update to authenticated using (user_id = auth.uid() or public.is_manager(auth.uid()));
create policy "own or staff delete" on public.market_listings for delete to authenticated using (user_id = auth.uid() or public.is_manager(auth.uid()));

-- notifications
create policy "own read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "own update" on public.notifications for update to authenticated using (user_id = auth.uid());
create policy "staff send" on public.notifications for insert to authenticated with check (public.is_manager(auth.uid()) or user_id = auth.uid());
create policy "own delete" on public.notifications for delete to authenticated using (user_id = auth.uid());

-- audit
create policy "insert own" on public.audit_logs for insert to authenticated with check (user_id = auth.uid());
create policy "admin read" on public.audit_logs for select to authenticated using (public.has_any_role(auth.uid(), array['super_admin','executive_director']::app_role[]));

-- notify applicant on status change
create or replace function public.notify_application_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (user_id, title, body)
    values (new.user_id, 'Funding application ' || new.status, 'Your application for ' || new.business_name || ' is now ' || new.status || '.');
  end if;
  return new;
end $$;
create trigger funding_app_status after update on public.funding_applications for each row execute function public.notify_application_status();

-- seed
insert into public.programs (name, description, focus_area) values
('Youth Skills Accelerator','Vocational and digital skills for young people aged 18-35.','Skills'),
('Women in Agribusiness','Supporting women farmers with training, inputs and market access.','Agriculture'),
('Green Livelihoods','Climate-smart enterprises and community conservation.','Environment');
insert into public.projects (program_id, name, location, budget, start_date, end_date, status, beneficiaries_reached)
select id, 'Digital Skills Hub', 'Dar es Salaam', 45000000, '2026-01-10', '2026-12-20', 'active', 320 from public.programs where name='Youth Skills Accelerator';
insert into public.projects (program_id, name, location, budget, start_date, end_date, status, beneficiaries_reached)
select id, 'Horticulture Cooperatives', 'Morogoro', 30000000, '2026-03-01', '2027-02-28', 'active', 210 from public.programs where name='Women in Agribusiness';
insert into public.projects (program_id, name, location, budget, start_date, end_date, status, beneficiaries_reached)
select id, 'Beekeeping for Forest Protection', 'Tabora', 18000000, '2026-05-01', '2027-04-30', 'planned', 0 from public.programs where name='Green Livelihoods';
insert into public.training_sessions (title, description, trainer, location, start_date, capacity) values
('Basic Computer & Internet Skills','Hands-on introduction to computers, email and online safety.','TDSP ICT Team','Dar es Salaam','2026-11-05',40),
('Tailoring & Garment Making','Three-week practical tailoring course with starter kits.','Mama Zawadi Collective','Arusha','2026-11-18',25),
('Business Planning for Small Enterprises','Write a business plan, keep records and manage cash flow.','TDSP Enterprise Unit','Mwanza','2026-12-02',35);
insert into public.funding_opportunities (title, description, funder, amount, deadline) values
('Youth Startup Seed Grant','Seed grants for youth-led businesses with a clear plan.','TDSP & Partners',2000000,'2026-12-15'),
('Women Agribusiness Input Support','Input and equipment support for women farmer groups.','Agri Partners Fund',5000000,'2027-01-31');
insert into public.partners (name, type, website, description) values
('Local Government Authorities','Government',null,'District-level coordination and beneficiary mobilisation.'),
('Community Savings Groups','Community',null,'VICOBA and savings groups that support graduates.');
insert into public.market_listings (user_id, title, description, category, price, unit, location, contact) values
('00000000-0000-0000-0000-000000000000','Fresh Tomatoes','Grade A tomatoes from the Morogoro women cooperative.','Produce',1500,'kg','Morogoro','+255 700 000 001'),
('00000000-0000-0000-0000-000000000000','Handmade Kitenge Dresses','Tailored by TDSP training graduates.','Clothing',35000,'piece','Arusha','+255 700 000 002'),
('00000000-0000-0000-0000-000000000000','Pure Forest Honey','Raw honey from community beekeepers.','Food',12000,'litre','Tabora','+255 700 000 003');