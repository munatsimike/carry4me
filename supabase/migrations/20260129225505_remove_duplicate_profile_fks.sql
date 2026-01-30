-- TRIPS: drop the duplicate FK (keep the standard one)
alter table public.trips
  drop constraint if exists trips_traveler_user_id_profiles_fkey;

-- PARCELS: drop the duplicate FK (adjust name if different)
alter table public.parcels
  drop constraint if exists parcels_sender_user_id_profiles_fkey;
