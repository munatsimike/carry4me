drop function if exists public.get_current_profile();

create or replace function public.get_current_profile()
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  city text,
  country text,
  country_code text,
  phone_number text,
  phone_verified boolean,
  account_status text,
  email text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.avatar_url,
    p.city,
    p.country,
    p.country_code,
    p.phone_number,
    p.phone_verified,
    p.account_status,
    p.email
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.get_current_profile() from public;
grant execute on function public.get_current_profile() to authenticated;
