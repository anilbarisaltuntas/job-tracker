create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  organizer text not null check (char_length(btrim(organizer)) between 1 and 160),
  opportunity_type text not null check (
    opportunity_type in (
      'bootcamp',
      'volunteer_project',
      'networking_event',
      'workshop_seminar',
      'hackathon',
      'mentorship_fellowship',
      'education_program',
      'other'
    )
  ),
  event_format text not null default 'online' check (
    event_format in ('online', 'in_person', 'hybrid')
  ),
  status text not null default 'to_apply' check (
    status in ('to_apply', 'applied', 'accepted', 'rejected')
  ),
  event_date date,
  application_date date,
  location text,
  opportunity_url text,
  notes text,
  kanban_order integer not null default 0 check (kanban_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.opportunities is
  'User-owned bootcamp, volunteer project, networking event and learning opportunity records.';

create index opportunities_user_id_idx
  on public.opportunities using btree (user_id);

create index opportunities_user_status_order_idx
  on public.opportunities using btree (user_id, status, kanban_order);

alter table public.opportunities enable row level security;

revoke all on table public.opportunities from anon;
grant select, insert, update, delete on table public.opportunities to authenticated;
grant select, insert, update, delete on table public.opportunities to service_role;

create policy "Users can view own opportunities"
  on public.opportunities
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create own opportunities"
  on public.opportunities
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own opportunities"
  on public.opportunities
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own opportunities"
  on public.opportunities
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
