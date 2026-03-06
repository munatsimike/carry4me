-- 20260304_allow_edit_join_tables.sql

begin;

-- =========================
-- parcel_categories
-- =========================

-- Data API requires GRANTs
grant select, insert, update, delete on table public.parcel_categories to authenticated;

-- Make sure RLS is on
alter table public.parcel_categories enable row level security;

-- Drop & recreate policies (so migration is re-runnable)
drop policy if exists parcel_categories_read_authenticated on public.parcel_categories;
drop policy if exists pc_read_owner on public.parcel_categories;
drop policy if exists pc_insert_owner on public.parcel_categories;
drop policy if exists pc_update_owner on public.parcel_categories;
drop policy if exists pc_delete_owner on public.parcel_categories;

-- Read: authenticated can read (option A)
create policy parcel_categories_read_authenticated
on public.parcel_categories
for select
to authenticated
using (true);

-- Insert: only if the parcel belongs to the user
create policy pc_insert_owner
on public.parcel_categories
for insert
to authenticated
with check (
  exists (
    select 1
    from public.parcels p
    where p.id = parcel_categories.parcel_id
      and p.sender_user_id = auth.uid()
  )
);

-- Update (EDIT): only if the parcel belongs to the user
create policy pc_update_owner
on public.parcel_categories
for update
to authenticated
using (
  exists (
    select 1
    from public.parcels p
    where p.id = parcel_categories.parcel_id
      and p.sender_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.parcels p
    where p.id = parcel_categories.parcel_id
      and p.sender_user_id = auth.uid()
  )
);

-- Delete: only if the parcel belongs to the user
create policy pc_delete_owner
on public.parcel_categories
for delete
to authenticated
using (
  exists (
    select 1
    from public.parcels p
    where p.id = parcel_categories.parcel_id
      and p.sender_user_id = auth.uid()
  )
);

-- =========================
-- trip_accepted_categories
-- =========================

-- Data API requires GRANTs
grant select on table public.trip_accepted_categories to anon;
grant select, insert, update, delete on table public.trip_accepted_categories to authenticated;

-- Make sure RLS is on
alter table public.trip_accepted_categories enable row level security;

drop policy if exists tac_read_all on public.trip_accepted_categories;
drop policy if exists tac_insert_owner on public.trip_accepted_categories;
drop policy if exists tac_update_owner on public.trip_accepted_categories;
drop policy if exists tac_delete_owner on public.trip_accepted_categories;

-- Read: allow anyone to read (anon + authenticated)
create policy tac_read_all
on public.trip_accepted_categories
for select
to anon, authenticated
using (true);

-- Insert: only if the trip belongs to the user
create policy tac_insert_owner
on public.trip_accepted_categories
for insert
to authenticated
with check (
  exists (
    select 1
    from public.trips t
    where t.id = trip_accepted_categories.trip_id
      and t.traveler_user_id = auth.uid()
  )
);

-- Update (EDIT): only if the trip belongs to the user
create policy tac_update_owner
on public.trip_accepted_categories
for update
to authenticated
using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_accepted_categories.trip_id
      and t.traveler_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trips t
    where t.id = trip_accepted_categories.trip_id
      and t.traveler_user_id = auth.uid()
  )
);

-- Delete: only if the trip belongs to the user
create policy tac_delete_owner
on public.trip_accepted_categories
for delete
to authenticated
using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_accepted_categories.trip_id
      and t.traveler_user_id = auth.uid()
  )
);

commit;