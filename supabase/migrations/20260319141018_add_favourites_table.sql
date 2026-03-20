-- Enable extension (if not already enabled)
create extension if not exists "pgcrypto";

-- Create favourites table
create table if not exists favourites (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  trip_id uuid references trips(id) on delete cascade,
  parcel_id uuid references parcels(id) on delete cascade,

  created_at timestamptz not null default now(),

  -- Ensure ONLY one is set (trip OR parcel)
  constraint favourites_only_one_target check (
    (trip_id is not null and parcel_id is null) or
    (trip_id is null and parcel_id is not null)
  )
);

-- Prevent duplicate favourites for trips
create unique index if not exists favourites_user_trip_unique
on favourites (user_id, trip_id)
where trip_id is not null;

-- Prevent duplicate favourites for parcels
create unique index if not exists favourites_user_parcel_unique
on favourites (user_id, parcel_id)
where parcel_id is not null;

-- Optional: index for faster lookups (very useful)
create index if not exists favourites_user_idx
on favourites (user_id);

create index if not exists favourites_trip_idx
on favourites (trip_id);

create index if not exists favourites_parcel_idx
on favourites (parcel_id);