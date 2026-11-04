-- BonSafar schema. Run it once in the Supabase SQL editor.
-- Data model: docs/parcours-et-interfaces.md section 5.
-- We never store audio: `trips.transcript` holds text only.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  ui_lang text not null default 'fr'
    check (ui_lang in ('fr', 'darija-latn', 'darija-arab', 'ar', 'en')),
  darija_script text not null default 'latn' check (darija_script in ('latn', 'arab')),
  home_airport text check (home_airport in ('CMN', 'RAK', 'RBA', 'TNG', 'FEZ', 'AGA', 'OUD')),
  companions text check (companions in ('solo', 'duo', 'family', 'friends')),
  children_count smallint not null default 0 check (children_count >= 0),
  passport_country text check (passport_country in ('ma', 'fr', 'both', 'other')),
  has_schengen boolean not null default false,
  passport_6m boolean not null default false,
  intl_card boolean not null default false,
  travel_style text check (travel_style in ('budget', 'comfort', 'premium')),
  prefs jsonb not null default '{}'::jsonb,
  haptics boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable by their owner" on public.profiles;
create policy "profiles are readable by their owner"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "profiles are insertable by their owner" on public.profiles;
create policy "profiles are insertable by their owner"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

drop policy if exists "profiles are updatable by their owner" on public.profiles;
create policy "profiles are updatable by their owner"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "profiles are deletable by their owner" on public.profiles;
create policy "profiles are deletable by their owner"
  on public.profiles for delete
  using ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------------

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  transcript text,
  intent jsonb,
  -- Offer ids and frozen prices, each with its source and fetch time.
  package jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'confirmed', 'archived')),
  poster_url text,
  created_at timestamptz not null default now()
);

create index if not exists trips_user_id_created_at_idx
  on public.trips (user_id, created_at desc);

alter table public.trips enable row level security;

drop policy if exists "trips are readable by their owner" on public.trips;
create policy "trips are readable by their owner"
  on public.trips for select
  using ((select auth.uid()) = user_id);

drop policy if exists "trips are insertable by their owner" on public.trips;
create policy "trips are insertable by their owner"
  on public.trips for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "trips are updatable by their owner" on public.trips;
create policy "trips are updatable by their owner"
  on public.trips for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "trips are deletable by their owner" on public.trips;
create policy "trips are deletable by their owner"
  on public.trips for delete
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- usage: spend counter and per-IP limit, written by the server only
-- ---------------------------------------------------------------------------

create table if not exists public.usage (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  run_id text not null,
  ip_hash text,
  step text,
  model text,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  cost_usd numeric(12, 6) not null default 0
);

create index if not exists usage_created_at_idx on public.usage (created_at desc);
create index if not exists usage_run_id_idx on public.usage (run_id);

alter table public.usage enable row level security;

-- No policy at all: RLS denies everything to anon and authenticated.
-- Only the server, with SUPABASE_SECRET_KEY, bypasses RLS and writes here.
-- The "RLS enabled, no policy" advisor notice is expected and wanted here.

-- ---------------------------------------------------------------------------
-- usage_daily and usage_ip_hourly: spend cap and live-run limits (migration add_usage_guards)
-- Written only by the server through the two functions below. The app keeps
-- working (no cap, no limit) until this migration is applied.
-- ---------------------------------------------------------------------------

create table if not exists public.usage_daily (
  day date primary key,
  cost_usd numeric(12, 6) not null default 0 check (cost_usd >= 0),
  runs integer not null default 0 check (runs >= 0),
  updated_at timestamptz not null default now()
);

alter table public.usage_daily enable row level security;
-- No policy: only the server, with SUPABASE_SECRET_KEY, reads and writes it.

-- Live agent runs per hashed IP and per clock hour. The IP is an HMAC with a
-- server-side salt, never the address itself.
create table if not exists public.usage_ip_hourly (
  ip_hash text not null check (char_length(ip_hash) = 64),
  hour timestamptz not null,
  runs integer not null default 0 check (runs >= 0),
  primary key (ip_hash, hour)
);

create index if not exists usage_ip_hourly_hour_idx on public.usage_ip_hourly (hour);

alter table public.usage_ip_hourly enable row level security;
-- No policy: only the server, with SUPABASE_SECRET_KEY, reads and writes it.

-- Adds the measured cost of a live request (and its agent runs) to today's row (UTC).
create or replace function public.usage_add(p_cost numeric, p_runs integer)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.usage_daily as u (day, cost_usd, runs)
  values ((now() at time zone 'utc')::date, greatest(p_cost, 0), greatest(p_runs, 0))
  on conflict (day) do update
    set cost_usd = u.cost_usd + excluded.cost_usd,
        runs = u.runs + excluded.runs,
        updated_at = now();
$$;

-- Takes one live-run slot for this hour. False when the hour is already full.
create or replace function public.usage_take_run(p_ip_hash text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  taken integer;
begin
  insert into public.usage_ip_hourly as u (ip_hash, hour, runs)
  values (p_ip_hash, date_trunc('hour', now()), 1)
  on conflict (ip_hash, hour) do update
    set runs = u.runs + 1
    where u.runs < p_limit
  returning runs into taken;

  delete from public.usage_ip_hourly where hour < now() - interval '2 days';

  return taken is not null;
end;
$$;

revoke execute on function public.usage_add(numeric, integer) from public, anon, authenticated;
revoke execute on function public.usage_take_run(text, integer) from public, anon, authenticated;
grant execute on function public.usage_add(numeric, integer) to service_role;
grant execute on function public.usage_take_run(text, integer) to service_role;

-- ---------------------------------------------------------------------------
-- runs: successful agent runs, saved for the honest replay (migration add_runs)
-- ---------------------------------------------------------------------------

create table if not exists public.runs (
  id text primary key,
  created_at timestamptz not null default now(),
  scenario text,
  intent jsonb not null,
  events jsonb not null,
  offers jsonb not null,
  package jsonb not null,
  prices_captured_at timestamptz not null
);

create index if not exists runs_scenario_created_at_idx
  on public.runs (scenario, created_at desc);

alter table public.runs enable row level security;
-- No policy: only the server, with SUPABASE_SECRET_KEY, reads and writes runs.

-- migration add_runs_stream
alter table public.runs add column if not exists stream jsonb;
comment on column public.runs.stream is
  'SSE events of the live run with their offset in ms, replayed by POST /api/agent with replay: true.';

-- ---------------------------------------------------------------------------
-- A profile row is created at sign-up, with the Google first name
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'given_name',
      split_part(new.raw_user_meta_data ->> 'full_name', ' ', 1),
      new.raw_user_meta_data ->> 'name'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- PostgREST exposes every public function as /rest/v1/rpc/<name>. Take EXECUTE
-- away from the API roles so only the trigger can run this security definer.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- ---------------------------------------------------------------------------
-- Storage: public bucket for the Rihla posters generated by Muse Image
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do update set public = true;

drop policy if exists "posters are readable by anyone" on storage.objects;
create policy "posters are readable by anyone"
  on storage.objects for select
  using (bucket_id = 'posters');

-- Uploads go through the server with SUPABASE_SECRET_KEY, so no insert policy.
