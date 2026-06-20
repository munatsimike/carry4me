ALTER TYPE public.trip_status ADD VALUE IF NOT EXISTS 'INACTIVE';
ALTER TYPE public.parcel_status ADD VALUE IF NOT EXISTS 'INACTIVE';

create or replace function public.recalculate_trip_status(p_trip_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  t record;
  v_available numeric;
  v_status_text text;
begin
  select *
  into t
  from public.trips
  where id = p_trip_id
  for update;

  if not found then
    return null;
  end if;

  v_status_text := t.status::text;

  if public.trip_status_is_terminal(t.status) then
    return v_status_text;
  end if;

  if t.status::text = 'INACTIVE' then
    return v_status_text;
  end if;

  if public.trip_departure_is_past(t.depart_date) then
    update public.trips
    set status = 'ARCHIVED'::public.trip_status,
        updated_at = now()
    where id = p_trip_id;

    return 'ARCHIVED';
  end if;

  v_available := greatest(
    0,
    t.capacity_kg - t.reserved_weight_kg - t.used_weight_kg
  );

  if v_available <= 0 then
    update public.trips
    set status = 'FULL'::public.trip_status,
        updated_at = now()
    where id = p_trip_id;

    return 'FULL';
  end if;

  update public.trips
  set status = 'ACTIVE'::public.trip_status,
      updated_at = now()
  where id = p_trip_id;

  return 'ACTIVE';
end;
$$;

revoke all on function public.recalculate_trip_status(uuid) from public;

create or replace function public.set_trip_listing_active(
  p_trip_id uuid,
  p_active boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.trip_status;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select t.status
  into v_status
  from public.trips t
  where t.id = p_trip_id
    and t.traveler_user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Trip not found';
  end if;

  if p_active then
    if v_status::text <> 'INACTIVE' then
      raise exception 'Only inactive trips can be activated';
    end if;

    update public.trips
    set status = 'ACTIVE'::public.trip_status,
        updated_at = now()
    where id = p_trip_id;

    return public.recalculate_trip_status(p_trip_id);
  end if;

  if v_status::text not in ('ACTIVE', 'FULL') then
    raise exception 'This trip cannot be deactivated';
  end if;

  update public.trips
  set status = 'INACTIVE'::public.trip_status,
      updated_at = now()
  where id = p_trip_id;

  return 'INACTIVE';
end;
$$;

revoke all on function public.set_trip_listing_active(uuid, boolean) from public;
grant execute on function public.set_trip_listing_active(uuid, boolean) to authenticated;

create or replace function public.set_parcel_listing_active(
  p_parcel_id uuid,
  p_active boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.parcel_status;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select p.status
  into v_status
  from public.parcels p
  where p.id = p_parcel_id
    and p.sender_user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Parcel not found';
  end if;

  if p_active then
    if v_status::text <> 'INACTIVE' then
      raise exception 'Only inactive parcels can be activated';
    end if;

    update public.parcels
    set status = 'OPEN'::public.parcel_status,
        updated_at = now()
    where id = p_parcel_id;

    return 'OPEN';
  end if;

  if v_status::text <> 'OPEN' then
    raise exception 'This parcel cannot be deactivated';
  end if;

  update public.parcels
  set status = 'INACTIVE'::public.parcel_status,
      updated_at = now()
  where id = p_parcel_id;

  return 'INACTIVE';
end;
$$;

revoke all on function public.set_parcel_listing_active(uuid, boolean) from public;
grant execute on function public.set_parcel_listing_active(uuid, boolean) to authenticated;
