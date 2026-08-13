create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  category text not null check (category in ('linkedin_connection', 'recruiter_message', 'follow_up_email', 'thank_you', 'custom')),
  content text not null check (char_length(content) between 1 and 4000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index message_templates_user_sort_idx
  on public.message_templates (user_id, sort_order, created_at);

alter table public.message_templates enable row level security;

create policy "Users can view own message templates"
  on public.message_templates for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own message templates"
  on public.message_templates for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own message templates"
  on public.message_templates for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own message templates"
  on public.message_templates for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.message_templates to authenticated;

create trigger update_message_templates_updated_at
  before update on public.message_templates
  for each row execute function public.update_updated_at_column();
