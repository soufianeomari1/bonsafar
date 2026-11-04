-- account_v2: express profile, booking status after the partner, price alerts.
-- Never a passport or card number. WhatsApp only with explicit consent.

-- profiles ------------------------------------------------------------------

-- Any departure airport, not only the seven Moroccan ones.
alter table public.profiles drop constraint if exists profiles_home_airport_check;
alter table public.profiles
  add constraint profiles_home_airport_check check (home_airport ~ '^[A-Z]{3}$');

alter table public.profiles
  add column if not exists children_ages smallint[] not null default '{}'
    check (array_length(children_ages, 1) is null or array_length(children_ages, 1) <= 9),
  -- Month and year only, 'YYYY-MM'.
  add column if not exists passport_expiry text
    check (passport_expiry ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  add column if not exists schengen_expiry text
    check (schengen_expiry ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  add column if not exists budget_band text
    check (budget_band in ('lt5k', '5to10k', '10to15k', '15to25k', 'gt25k')),
  add column if not exists fav_months smallint[] not null default '{}'
    check (fav_months <@ array[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]::smallint[]),
  add column if not exists whatsapp_number text
    check (whatsapp_number ~ '^\+[0-9]{8,15}$'),
  -- Set when the traveller ticks the separate consent box; null means no WhatsApp at all.
  add column if not exists whatsapp_consent_at timestamptz;

-- trips ---------------------------------------------------------------------

alter table public.trips
  add column if not exists run_id text,
  add column if not exists booking_status text
    check (booking_status in ('booked', 'to_confirm', 'issue')),
  add column if not exists booking_partner text
    check (booking_partner in ('kiwi.com', 'trivago')),
  add column if not exists booking_issue text
    check (booking_issue in ('price_changed', 'sold_out', 'payment', 'site_error', 'other')),
  add column if not exists booking_updated_at timestamptz;

create unique index if not exists trips_user_id_run_id_idx
  on public.trips (user_id, run_id) where run_id is not null;

-- price_alerts --------------------------------------------------------------

create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, trip_id)
);

create index if not exists price_alerts_trip_id_idx on public.price_alerts (trip_id);

alter table public.price_alerts enable row level security;

drop policy if exists "price alerts are readable by their owner" on public.price_alerts;
create policy "price alerts are readable by their owner"
  on public.price_alerts for select
  using ((select auth.uid()) = user_id);

drop policy if exists "price alerts are insertable by their owner" on public.price_alerts;
create policy "price alerts are insertable by their owner"
  on public.price_alerts for insert
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.trips t where t.id = trip_id and t.user_id = (select auth.uid()))
  );

drop policy if exists "price alerts are updatable by their owner" on public.price_alerts;
create policy "price alerts are updatable by their owner"
  on public.price_alerts for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "price alerts are deletable by their owner" on public.price_alerts;
create policy "price alerts are deletable by their owner"
  on public.price_alerts for delete
  using ((select auth.uid()) = user_id);
