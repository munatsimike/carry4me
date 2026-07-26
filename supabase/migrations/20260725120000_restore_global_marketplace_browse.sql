-- Restore global marketplace browse for every account type.
-- Country filtering stays in the app Filter by Country control.

begin;

drop policy if exists trips_public_read_active_or_owner on public.trips;

create policy trips_public_read_active_or_owner
on public.trips
for select
to anon, authenticated
using (
  status = 'ACTIVE'
  or traveler_user_id = auth.uid()
);

drop policy if exists parcels_public_read_open_or_owner on public.parcels;

create policy parcels_public_read_open_or_owner
on public.parcels
for select
to anon, authenticated
using (
  status = 'OPEN'
  or sender_user_id = auth.uid()
);

-- Keep helpers harmless if anything still references them.
create or replace function public.marketplace_origin_visible_to_viewer(
  p_origin_country text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select true;
$$;

commit;
