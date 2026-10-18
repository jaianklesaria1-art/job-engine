-- Job Engine schema. Run once in Supabase SQL editor.
-- Bots write with the service_role key (bypasses RLS). The dashboard reads/writes as Jai's logged-in user.

create extension if not exists pgcrypto;

create or replace function public.is_owner() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'jaianklesaria.jobs@gmail.com'
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Companies
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text unique,
  about text,
  industry text,
  size_label text,
  headcount int,
  funding_stage text,
  investors text,
  hq text,
  india_offices text,
  website text,
  careers_url text,
  design_team_count int,
  news jsonb not null default '[]'::jsonb,          -- [{title, url, date}]
  sponsor_status text not null default 'not_applicable'
    check (sponsor_status in ('confirmed','likely','not_stated','no','not_applicable')),
  sponsor_source text,
  why_fit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Jobs
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  company_name text not null,
  title text not null,
  title_group text,                                  -- one of Jai's 7 target titles
  seniority text,                                    -- junior / mid / unknown
  location text,
  city text,
  country text,
  remote_type text not null default 'unknown'
    check (remote_type in ('onsite','hybrid','remote','unknown')),
  posted_at timestamptz,
  first_seen_at timestamptz not null default now(),
  sources text[] not null default '{}',
  urls text[] not null default '{}',
  apply_url text,
  description text,
  salary_text text,
  week_type text not null default 'A' check (week_type in ('A','B')),
  status text not null default 'found'
    check (status in ('found','shortlisted','applied','contacted','replied','interview','offer','rejected','skipped')),
  status_changed_at timestamptz not null default now(),
  dedupe_key text not null unique,                  -- lower(company|title|city)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_first_seen_idx on public.jobs (first_seen_at desc);
create index if not exists jobs_status_idx on public.jobs (status);

-- CV scores (one per job)
create table if not exists public.job_scores (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  score_now int not null check (score_now between 0 and 100),
  score_possible int not null check (score_possible between 0 and 100),
  breakdown jsonb not null default '{}'::jsonb,      -- {skills:{got,max}, title:{..}, domain:{..}, keywords:{..}, location:{..}}
  green_items jsonb not null default '[]'::jsonb,    -- [{id, keyword, line, points, source}]
  red_items jsonb not null default '[]'::jsonb,      -- [{keyword, note}]
  keywords jsonb not null default '[]'::jsonb,       -- [{keyword, present}]
  ticked_items jsonb not null default '[]'::jsonb,   -- green item ids Jai ticked
  verdict text check (verdict in ('apply','tailor','skip')),
  verdict_reason text,
  tailored_cv_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Timeline
create table if not exists public.job_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.jobs(id) on delete cascade,
  kind text not null,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists job_events_job_idx on public.job_events (job_id, created_at desc);

create or replace function public.jobs_status_changed() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at = now();
    insert into public.job_events (job_id, kind, detail)
      values (new.id, 'status', old.status || ' -> ' || new.status);
  end if;
  return new;
end $$;

-- Contacts
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  name text not null,
  role text,
  type text not null check (type in ('hiring_manager','peer')),
  email text,
  email_status text not null default 'not_found'
    check (email_status in ('verified','accept_all','not_found','invalid')),
  linkedin_url text,
  linkedin_status text not null default 'not_sent'
    check (linkedin_status in ('not_sent','sent','accepted')),
  linkedin_note text,                                -- max 200 chars
  linkedin_message text,
  last_contacted_at timestamptz,
  reply_type text,
  do_not_contact boolean not null default false,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

-- Email batches and emails
create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending','approved','rejected','sent')),
  email_count int not null default 0,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.outreach (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  batch_id uuid references public.batches(id) on delete set null,
  template text not null check (template in ('hiring_manager','peer','follow_up')),
  subject text not null,
  body text not null,
  personal_lines jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
    check (status in ('draft','approved','sent','replied','bounced','rejected','removed')),
  sent_at timestamptz,
  follow_up_due date,
  gmail_thread_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists outreach_batch_idx on public.outreach (batch_id);

create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  outreach_id uuid references public.outreach(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  received_at timestamptz not null default now(),
  type text not null check (type in ('positive','referral','not_hiring','not_interested','out_of_office','bounce','other')),
  summary text,
  gmail_thread_id text,
  seen boolean not null default false
);

-- Bot runs and dashboard requests
create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  bot text not null check (bot in ('job_scout','contact_finder','outreach','inbox_tracker','request_checker')),
  status text not null default 'running' check (status in ('running','ok','error')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  sources_checked int,
  found int,
  new_items int,
  credits jsonb not null default '{}'::jsonb,        -- {firecrawl_left, hunter_used, hunter_limit}
  errors jsonb not null default '[]'::jsonb,
  summary text
);
create index if not exists runs_bot_idx on public.runs (bot, started_at desc);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('run_now','tailor_cv','send_batch','find_contacts')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','done','error')),
  result jsonb,
  created_at timestamptz not null default now(),
  done_at timestamptz
);

-- Settings (single row)
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  week_type text not null default 'A' check (week_type in ('A','B')),
  titles text[] not null default array['Product Designer','UX Designer','UX/UI Designer','UX Analyst','UX Researcher','AI Product Designer','UX Engineer'],
  freshness_days int not null default 5,
  score_threshold int not null default 75,
  email_cap int not null default 10,                -- warm-up week 1
  warmup boolean not null default true,
  contacts_hiring_managers int not null default 2,
  contacts_peers int not null default 2,
  notice_period text not null default '1 month',
  paused boolean not null default false,
  telegram jsonb not null default '{"job_scout":true,"contact_finder":true,"outreach":true,"inbox_tracker":true}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- Triggers
do $$
declare t text;
begin
  foreach t in array array['companies','jobs','job_scores','contacts','outreach','settings'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format('create trigger touch_%1$s before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

drop trigger if exists jobs_status_change on public.jobs;
create trigger jobs_status_change before update of status on public.jobs
  for each row execute function public.jobs_status_changed();

-- Row-level security: only Jai's login
do $$
declare t text;
begin
  foreach t in array array['companies','jobs','job_scores','job_events','contacts','batches','outreach','replies','runs','requests','settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists owner_all on public.%I', t);
    execute format('create policy owner_all on public.%I for all to authenticated using (public.is_owner()) with check (public.is_owner())', t);
  end loop;
end $$;

-- Realtime for live dashboard updates
do $$
declare t text;
begin
  foreach t in array array['jobs','job_scores','contacts','batches','outreach','replies','runs','requests'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
