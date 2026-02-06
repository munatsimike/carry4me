-- 1) Add columns with defaults (so existing rows don’t fail)
alter table public.carry_requests
add column if not exists initiator_role text not null default 'sender',
add column if not exists parcel_snapshot jsonb not null default '{}'::jsonb,
add column if not exists trip_snapshot jsonb not null default '{}'::jsonb;

-- 2) Add constraints (recommended)
alter table public.carry_requests
add constraint carry_requests_initiator_role_check
check (initiator_role in ('sender', 'traveler'));

-- Optional: constrain status to a known set
-- (edit values to match your flow)
alter table public.carry_requests
add constraint carry_requests_status_check
check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'completed'));

-- 3) (Optional) Remove defaults after backfill, so you must explicitly set them on insert
alter table public.carry_requests
alter column initiator_role drop default,
alter column parcel_snapshot drop default,
alter column trip_snapshot drop default;

-- 4) Helpful indexes (optional but very useful)
create index if not exists carry_requests_sender_user_id_idx
on public.carry_requests (sender_user_id);

create index if not exists carry_requests_traveler_user_id_idx
on public.carry_requests (traveler_user_id);

create index if not exists carry_requests_trip_id_idx
on public.carry_requests (trip_id);

create index if not exists carry_requests_parcel_id_idx
on public.carry_requests (parcel_id);

create index if not exists carry_requests_status_idx
on public.carry_requests (status);
