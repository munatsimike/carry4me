-- Enable RLS if not already enabled
alter table public.trips enable row level security;
alter table public.parcels enable row level security;

-- ============================
-- DELETE policy for TRIPS
-- ============================
create policy "users can delete own trips"
on public.trips
for delete
to authenticated
using (
  auth.uid() = traveler_user_id
);

-- ============================
-- DELETE policy for PARCELS
-- ============================
create policy "users can delete own parcels"
on public.parcels
for delete
to authenticated
using (
  auth.uid() = sender_user_id
);