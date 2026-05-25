-- Refine trip status recalculation: terminal protection + type-aware past-departure checks.
-- trips.depart_date is date (see 20260126161009_rebuild_schema.sql).
-- trip_status enum: ACTIVE, FULL, ARCHIVED (terminal = ARCHIVED; CANCELLED/COMPLETED reserved for future enum values).

create or replace function public.trip_status_is_terminal(p_status public.trip_status)
returns boolean
language sql
immutable
as $$
  select p_status::text in ('ARCHIVED', 'CANCELLED', 'COMPLETED');
$$;

revoke all on function public.trip_status_is_terminal(public.trip_status) from public;

-- date: archive after the departure calendar day has ended
create or replace function public.trip_departure_is_past(p_departure date)
returns boolean
language sql
stable
as $$
  select p_departure < current_date;
$$;

revoke all on function public.trip_departure_is_past(date) from public;

-- timestamp / timestamptz: archive as soon as departure moment has passed
create or replace function public.trip_departure_is_past(p_departure timestamp without time zone)
returns boolean
language sql
stable
as $$
  select p_departure <= now();
$$;

revoke all on function public.trip_departure_is_past(timestamp without time zone) from public;

create or replace function public.trip_departure_is_past(p_departure timestamp with time zone)
returns boolean
language sql
stable
as $$
  select p_departure <= now();
$$;

revoke all on function public.trip_departure_is_past(timestamp with time zone) from public;

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

create or replace function public.archive_past_trips()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.trips t
  set status = 'ARCHIVED'::public.trip_status,
      updated_at = now()
  where public.trip_departure_is_past(t.depart_date)
    and not public.trip_status_is_terminal(t.status);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.archive_past_trips() from public;
grant execute on function public.archive_past_trips() to authenticated;
