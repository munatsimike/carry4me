-- =========================
-- CLEAN REBUILD (local)
-- =========================

-- PROFILES
drop table if exists public.profiles cascade;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "users can insert own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid());


-- TRIPS
drop table if exists public.trips cascade;
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  traveler_user_id uuid not null references auth.users(id) on delete cascade,

  origin_country text not null,
  origin_city text not null,
  destination_country text not null,
  destination_city text not null,

  depart_date date not null,
  arrive_date date,

  capacity_kg numeric not null,
  price_per_kg numeric not null,
  status text not null default 'open',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "anyone can read trips"
on public.trips for select
to public
using (true);

create policy "users can create own trips"
on public.trips for insert
to authenticated
with check (traveler_user_id = auth.uid());

create policy "users can update own trips"
on public.trips for update
to authenticated
using (traveler_user_id = auth.uid());


-- PARCELS
drop table if exists public.parcels cascade;
create table public.parcels (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users(id) on delete cascade,

  origin_country text not null,
  origin_city text not null,
  destination_country text not null,
  destination_city text not null,

  weight_kg numeric not null,
  description text,
  status text not null default 'open',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parcels enable row level security;

create policy "anyone can read parcels"
on public.parcels for select
to public
using (true);

create policy "users can create own parcels"
on public.parcels for insert
to authenticated
with check (sender_user_id = auth.uid());

create policy "users can update own parcels"
on public.parcels for update
to authenticated
using (sender_user_id = auth.uid());


-- CARRY REQUESTS
drop table if exists public.carry_requests cascade;
create table public.carry_requests (
  id uuid primary key default gen_random_uuid(),

  trip_id uuid not null references public.trips(id) on delete cascade,
  parcel_id uuid not null references public.parcels(id) on delete cascade,

  sender_user_id uuid not null references auth.users(id) on delete cascade,
  traveler_user_id uuid not null references auth.users(id) on delete cascade,

  status text not null default 'pending',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- prevent duplicate requests for same trip+parcel
  unique (trip_id, parcel_id)
);

alter table public.carry_requests enable row level security;

create policy "users can read own carry requests"
on public.carry_requests for select
to authenticated
using (
  sender_user_id = auth.uid()
  or traveler_user_id = auth.uid()
);

create policy "sender can create carry requests"
on public.carry_requests for insert
to authenticated
with check (sender_user_id = auth.uid());

create policy "parties can update carry requests"
on public.carry_requests for update
to authenticated
using (
  sender_user_id = auth.uid()
  or traveler_user_id = auth.uid()
);