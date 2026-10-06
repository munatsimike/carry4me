-- Travelers can list spare bags (and a price per bag) instead of kg.

alter table public.trips
  add column if not exists capacity_unit text not null default 'kg';

update public.trips
set capacity_unit = 'kg'
where capacity_unit is null;

alter table public.trips
  drop constraint if exists trips_capacity_unit_check;

alter table public.trips
  add constraint trips_capacity_unit_check
  check (capacity_unit in ('kg', 'bag'));

alter table public.trips
  drop constraint if exists trips_bag_capacity_valid;

alter table public.trips
  add constraint trips_bag_capacity_valid
  check (
    capacity_unit <> 'bag'
    or (
      capacity_kg >= 1
      and capacity_kg <= 20
      and capacity_kg = trunc(capacity_kg)
    )
  );

comment on column public.trips.capacity_unit is
  'How capacity_kg and price_per_kg are denominated: kg, or bag (1 request = 1 bag).';

create or replace function public.listing_weight_fits(
  p_parcel_id uuid,
  p_trip_id uuid
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    case
      when coalesce(t.capacity_unit, 'kg') = 'bag' then
        (t.capacity_kg - t.reserved_weight_kg - t.used_weight_kg) >= 1
      else
        p.weight_kg <= (t.capacity_kg - t.reserved_weight_kg - t.used_weight_kg)
    end
  from public.parcels p
  inner join public.trips t on t.id = p_trip_id
  where p.id = p_parcel_id;
$$;

create or replace function public.carry_request_weight_kg(p_request_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    case
      when coalesce(t.capacity_unit, 'kg') = 'bag' then 1::numeric
      else null
    end,
    nullif((cr.parcel_snapshot ->> 'weight_kg')::numeric, 0),
    p.weight_kg,
    0
  )
  from public.carry_requests cr
  join public.parcels p on p.id = cr.parcel_id
  join public.trips t on t.id = cr.trip_id
  where cr.id = p_request_id;
$$;

create or replace function public.trip_has_available_capacity(
  p_trip_id uuid,
  p_required_weight numeric
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    case
      when coalesce(capacity_unit, 'kg') = 'bag' then
        (capacity_kg - reserved_weight_kg - used_weight_kg) >= 1
      else
        (capacity_kg - reserved_weight_kg - used_weight_kg) >= p_required_weight
    end
  from public.trips
  where id = p_trip_id;
$$;
