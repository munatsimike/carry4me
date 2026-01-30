-- allow viewing profiles (for joins)
create policy "profiles viewable by authenticated"
on public.profiles
for select
to authenticated
using (true);

-- add FK trips -> profiles
alter table public.trips
add constraint trips_traveler_user_id_profiles_fkey
foreign key (traveler_user_id)
references public.profiles (id);

-- add FK parcels -> profiles (if you want it too)
alter table public.parcels
add constraint parcels_sender_user_id_profiles_fkey
foreign key (sender_user_id)
references public.profiles (id);
