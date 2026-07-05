-- Ordinary users must post parcels/trips from their verified profile country.
-- Admin profiles may choose any origin country.

create or replace function public.enforce_listing_origin_country()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_profile_type text;
  v_profile_country text;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  v_user_id := case tg_table_name
    when 'parcels' then new.sender_user_id
    when 'trips' then new.traveler_user_id
    else auth.uid()
  end;

  select
    profile_type,
    coalesce(nullif(trim(country_code), ''), nullif(trim(country), ''))
  into v_profile_type, v_profile_country
  from public.profiles
  where id = v_user_id;

  if coalesce(v_profile_type, 'ordinary') = 'admin' then
    return new;
  end if;

  if v_profile_country is null or trim(v_profile_country) = '' then
    raise exception 'Complete your profile country before posting listings.'
      using errcode = '42501';
  end if;

  if public.canonical_listing_country(new.origin_country)
     is distinct from public.canonical_listing_country(v_profile_country) then
    raise exception 'Origin country must match your verified profile country.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists parcels_enforce_origin_country on public.parcels;

create trigger parcels_enforce_origin_country
before insert or update of origin_country on public.parcels
for each row
execute function public.enforce_listing_origin_country();

drop trigger if exists trips_enforce_origin_country on public.trips;

create trigger trips_enforce_origin_country
before insert or update of origin_country on public.trips
for each row
execute function public.enforce_listing_origin_country();

create or replace function public.protect_profile_country()
returns trigger
language plpgsql
as $$
begin
  if auth.role() is distinct from 'service_role' then
    if coalesce(old.profile_type, 'ordinary') <> 'admin' then
      new.country := old.country;
      new.country_code := old.country_code;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_country on public.profiles;

create trigger profiles_protect_country
before update on public.profiles
for each row
execute function public.protect_profile_country();
