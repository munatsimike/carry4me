-- =========================
-- 1) ENABLE RLS
-- =========================
alter table public.goods_categories enable row level security;
alter table public.trip_accepted_categories enable row level security;
alter table public.parcel_categories enable row level security;


-- =========================
-- 2) GOODS CATEGORIES
-- Everyone can read; no client writes
-- =========================
drop policy if exists "categories_read_all" on public.goods_categories;

create policy "categories_read_all"
on public.goods_categories
for select
to anon, authenticated
using (true);

-- No insert/update/delete policies on purpose (blocks client writes)


-- =========================
-- 3) TRIP_ACCEPTED_CATEGORIES
-- Read: allowed for everyone (since trips are likely public in your current setup)
-- Write: only the trip owner can add/remove categories
-- =========================
drop policy if exists "tac_read_all" on public.trip_accepted_categories;
drop policy if exists "tac_insert_owner" on public.trip_accepted_categories;
drop policy if exists "tac_delete_owner" on public.trip_accepted_categories;

create policy "tac_read_all"
on public.trip_accepted_categories
for select
to anon, authenticated
using (true);

create policy "tac_insert_owner"
on public.trip_accepted_categories
for insert
to authenticated
with check (
  exists (
    select 1
    from public.trips t
    where t.id = trip_id
      and t.traveler_user_id = auth.uid()
  )
);

create policy "tac_delete_owner"
on public.trip_accepted_categories
for delete
to authenticated
using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_id
      and t.traveler_user_id = auth.uid()
  )
);


-- =========================
-- 4) PARCEL_CATEGORIES
-- Read/Write: only parcel owner (because parcels are usually private)
-- =========================
drop policy if exists "pc_read_owner" on public.parcel_categories;
drop policy if exists "pc_insert_owner" on public.parcel_categories;
drop policy if exists "pc_delete_owner" on public.parcel_categories;

create policy "pc_read_owner"
on public.parcel_categories
for select
to authenticated
using (
  exists (
    select 1
    from public.parcels p
    where p.id = parcel_id
      and p.sender_user_id = auth.uid()
  )
);

create policy "pc_insert_owner"
on public.parcel_categories
for insert
to authenticated
with check (
  exists (
    select 1
    from public.parcels p
    where p.id = parcel_id
      and p.sender_user_id = auth.uid()
  )
);

create policy "pc_delete_owner"
on public.parcel_categories
for delete
to authenticated
using (
  exists (
    select 1
    from public.parcels p
    where p.id = parcel_id
      and p.sender_user_id = auth.uid()
  )
);
