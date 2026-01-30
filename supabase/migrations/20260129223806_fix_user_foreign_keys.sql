-- =========================
-- TRIPS → PROFILES
-- =========================
alter table public.trips
  drop constraint if exists trips_traveler_user_id_fkey;

alter table public.trips
  add constraint trips_traveler_user_id_fkey
  foreign key (traveler_user_id)
  references public.profiles(id)
  on delete cascade;


-- =========================
-- PARCELS → PROFILES
-- =========================
alter table public.parcels
  drop constraint if exists parcels_sender_user_id_fkey;

alter table public.parcels
  add constraint parcels_sender_user_id_fkey
  foreign key (sender_user_id)
  references public.profiles(id)
  on delete cascade;
