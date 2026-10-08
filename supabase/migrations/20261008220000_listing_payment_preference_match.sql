-- Persist listing payment preferences and use them as a match factor
-- (alongside country, category, and weight). Existing listings stay flexible.

alter table public.parcels
  add column if not exists payment_preference text not null default 'flexible';

alter table public.trips
  add column if not exists payment_preference text not null default 'flexible';

update public.parcels
set payment_preference = 'flexible'
where payment_preference is null
   or payment_preference not in ('handover', 'delivery', 'flexible');

update public.trips
set payment_preference = 'flexible'
where payment_preference is null
   or payment_preference not in ('handover', 'delivery', 'flexible');

alter table public.parcels
  drop constraint if exists parcels_payment_preference_check;

alter table public.parcels
  add constraint parcels_payment_preference_check
  check (payment_preference in ('handover', 'delivery', 'flexible'));

alter table public.trips
  drop constraint if exists trips_payment_preference_check;

alter table public.trips
  add constraint trips_payment_preference_check
  check (payment_preference in ('handover', 'delivery', 'flexible'));

comment on column public.parcels.payment_preference is
  'When the sender prefers to pay: handover, delivery, or flexible.';

comment on column public.trips.payment_preference is
  'When the traveler prefers to be paid: handover, delivery, or flexible.';

create or replace function public.listing_payment_preferences_match(
  a_preference text,
  b_preference text
)
returns boolean
language sql
immutable
as $$
  select
    case
      when coalesce(nullif(lower(trim(a_preference)), ''), 'flexible') = 'flexible'
        then true
      when coalesce(nullif(lower(trim(b_preference)), ''), 'flexible') = 'flexible'
        then true
      else
        coalesce(nullif(lower(trim(a_preference)), ''), 'flexible')
        = coalesce(nullif(lower(trim(b_preference)), ''), 'flexible')
    end;
$$;

create or replace function public.emit_listing_match_events_for_trip(p_trip_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip record;
  v_match record;
  v_count integer := 0;
begin
  select
    t.id,
    t.traveler_user_id,
    t.origin_country,
    t.destination_country,
    t.status,
    t.payment_preference
  into v_trip
  from public.trips t
  where t.id = p_trip_id;

  if not found or v_trip.status is distinct from 'ACTIVE'::public.trip_status then
    return 0;
  end if;

  for v_match in
    select
      p.id as source_listing_id,
      p.sender_user_id as recipient_user_id
    from public.parcels p
    where p.status = 'OPEN'::public.parcel_status
      and p.sender_user_id is distinct from v_trip.traveler_user_id
      and public.listing_countries_match(
        p.origin_country,
        p.destination_country,
        v_trip.origin_country,
        v_trip.destination_country
      )
      and public.listing_categories_match(p.id, v_trip.id)
      and public.listing_weight_fits(p.id, v_trip.id)
      and public.listing_payment_preferences_match(
        p.payment_preference,
        v_trip.payment_preference
      )
  loop
    perform public.insert_listing_match_event(
      'MATCHING_TRIP_POSTED',
      v_trip.traveler_user_id,
      v_match.recipient_user_id,
      'trip',
      v_trip.id,
      'parcel',
      v_match.source_listing_id
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.emit_listing_match_events_for_parcel(p_parcel_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parcel record;
  v_match record;
  v_count integer := 0;
begin
  select
    p.id,
    p.sender_user_id,
    p.origin_country,
    p.destination_country,
    p.status,
    p.payment_preference
  into v_parcel
  from public.parcels p
  where p.id = p_parcel_id;

  if not found or v_parcel.status is distinct from 'OPEN'::public.parcel_status then
    return 0;
  end if;

  for v_match in
    select
      t.id as source_listing_id,
      t.traveler_user_id as recipient_user_id
    from public.trips t
    where t.status = 'ACTIVE'::public.trip_status
      and t.traveler_user_id is distinct from v_parcel.sender_user_id
      and public.listing_countries_match(
        t.origin_country,
        t.destination_country,
        v_parcel.origin_country,
        v_parcel.destination_country
      )
      and public.listing_categories_match(v_parcel.id, t.id)
      and public.listing_weight_fits(v_parcel.id, t.id)
      and public.listing_payment_preferences_match(
        v_parcel.payment_preference,
        t.payment_preference
      )
  loop
    perform public.insert_listing_match_event(
      'MATCHING_PARCEL_POSTED',
      v_parcel.sender_user_id,
      v_match.recipient_user_id,
      'parcel',
      v_parcel.id,
      'trip',
      v_match.source_listing_id
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.emit_listing_match_events_on_trip_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from 'ACTIVE'::public.trip_status then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.origin_country is not distinct from old.origin_country
       and new.destination_country is not distinct from old.destination_country
       and new.capacity_kg is not distinct from old.capacity_kg
       and new.reserved_weight_kg is not distinct from old.reserved_weight_kg
       and new.used_weight_kg is not distinct from old.used_weight_kg
       and new.status is not distinct from old.status
       and new.payment_preference is not distinct from old.payment_preference
    then
      return new;
    end if;
  end if;

  perform public.emit_listing_match_events_for_trip(new.id);
  return new;
end;
$$;

create or replace function public.emit_listing_match_events_on_parcel_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from 'OPEN'::public.parcel_status then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.origin_country is not distinct from old.origin_country
       and new.destination_country is not distinct from old.destination_country
       and new.weight_kg is not distinct from old.weight_kg
       and new.status is not distinct from old.status
       and new.payment_preference is not distinct from old.payment_preference
    then
      return new;
    end if;
  end if;

  perform public.emit_listing_match_events_for_parcel(new.id);
  return new;
end;
$$;

revoke all on function public.listing_payment_preferences_match(text, text) from public;
