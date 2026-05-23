begin;

-- App country codes include UK, USA, NL, ZW (not only ISO-3166 alpha-2).
alter table public.profiles
  drop constraint if exists profiles_country_code_len;

alter table public.profiles
  add constraint profiles_country_code_len
  check (
    country_code is null
    or (char_length(country_code) >= 2 and char_length(country_code) <= 3)
  );

-- Complete profile via SECURITY DEFINER so RLS cannot block first-time setup.
create or replace function public.complete_current_profile(
  p_full_name text,
  p_city text,
  p_country_code text,
  p_country text,
  p_email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_phone text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select coalesce(nullif(trim(p.phone_number), ''), nullif(trim(u.phone), ''))
  into v_phone
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_user_id;

  insert into public.profiles (
    id,
    full_name,
    city,
    country_code,
    country,
    email,
    phone_number,
    phone_verified,
    account_status
  )
  values (
    v_user_id,
    nullif(trim(p_full_name), ''),
    nullif(trim(p_city), ''),
    nullif(trim(p_country_code), ''),
    nullif(trim(p_country), ''),
    nullif(trim(lower(p_email)), ''),
    v_phone,
    true,
    'active'
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    city = excluded.city,
    country_code = excluded.country_code,
    country = excluded.country,
    email = excluded.email,
    phone_number = coalesce(excluded.phone_number, public.profiles.phone_number),
    phone_verified = true,
    account_status = case
      when public.profiles.account_status = 'suspended' then public.profiles.account_status
      else 'active'
    end,
    updated_at = now();

  return v_user_id;
end;
$$;

revoke all on function public.complete_current_profile(text, text, text, text, text) from public;
grant execute on function public.complete_current_profile(text, text, text, text, text) to authenticated;

commit;
