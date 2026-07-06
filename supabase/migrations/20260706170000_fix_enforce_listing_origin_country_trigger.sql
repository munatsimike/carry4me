-- Fix trip inserts: PL/pgSQL validates all NEW.* references in CASE branches,
-- so a shared trigger function cannot reference sender_user_id on trips.

create or replace function public.assert_profile_origin_country(
  p_user_id uuid,
  p_origin_country text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_type text;
  v_profile_country text;
begin
  if auth.role() = 'service_role' then
    return;
  end if;

  select
    profile_type,
    coalesce(nullif(trim(country_code), ''), nullif(trim(country), ''))
  into v_profile_type, v_profile_country
  from public.profiles
  where id = p_user_id;

  if coalesce(v_profile_type, 'ordinary') = 'admin' then
    return;
  end if;

  if v_profile_country is null or trim(v_profile_country) = '' then
    raise exception 'Complete your profile country before posting listings.'
      using errcode = '42501';
  end if;

  if public.canonical_listing_country(p_origin_country)
     is distinct from public.canonical_listing_country(v_profile_country) then
    raise exception 'Origin country must match your verified profile country.'
      using errcode = '42501';
  end if;
end;
$$;

create or replace function public.enforce_parcel_origin_country()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_profile_origin_country(new.sender_user_id, new.origin_country);
  return new;
end;
$$;

create or replace function public.enforce_trip_origin_country()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_profile_origin_country(new.traveler_user_id, new.origin_country);
  return new;
end;
$$;

drop trigger if exists parcels_enforce_origin_country on public.parcels;

create trigger parcels_enforce_origin_country
before insert or update of origin_country on public.parcels
for each row
execute function public.enforce_parcel_origin_country();

drop trigger if exists trips_enforce_origin_country on public.trips;

create trigger trips_enforce_origin_country
before insert or update of origin_country on public.trips
for each row
execute function public.enforce_trip_origin_country();

drop function if exists public.enforce_listing_origin_country();
