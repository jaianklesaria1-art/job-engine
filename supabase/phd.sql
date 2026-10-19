-- PhD tab: open PhD positions, eligibility, and a draft proposal for each.
-- Run once in the Supabase SQL editor (safe to run again).

create table if not exists public.phd_positions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  university text not null,
  group_name text,
  supervisor text,
  contact_email text,
  city text,
  country text,
  url text,
  post_url text,
  deadline date,
  start_date text,
  funding text,
  eligibility text,
  eligibility_status text not null default 'check'
    check (eligibility_status in ('eligible','check','not_eligible')),
  fit_reason text,
  gaps jsonb not null default '[]'::jsonb,        -- ["Physical computing (Arduino) not in your bank yet", ...]
  checklist jsonb not null default '[]'::jsonb,   -- [{"item": "CV", "done": false}, ...]
  proposal jsonb not null default '[]'::jsonb,    -- [{"heading": "Working title", "body": "..."}, ...]
  proposal_limit text,
  status text not null default 'to_apply'
    check (status in ('to_apply','drafting','ready','applied','interview','offer','rejected','skipped')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists phd_positions_touch on public.phd_positions;
create trigger phd_positions_touch before update on public.phd_positions
  for each row execute function public.touch_updated_at();

alter table public.phd_positions enable row level security;
drop policy if exists owner_all on public.phd_positions;
create policy owner_all on public.phd_positions for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

do $$ begin
  alter publication supabase_realtime add table public.phd_positions;
exception when duplicate_object then null; end $$;
