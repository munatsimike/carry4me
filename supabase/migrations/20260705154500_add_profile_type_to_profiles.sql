-- Profile type: ordinary (default) or admin. Admin is set manually in the database.

alter table public.profiles
  add column if not exists profile_type text not null default 'ordinary';

alter table public.profiles
  drop constraint if exists profiles_profile_type_check;

alter table public.profiles
  add constraint profiles_profile_type_check
  check (profile_type in ('ordinary', 'admin'));

comment on column public.profiles.profile_type is
  'User access tier: ordinary (default) or admin. Not user-editable; set via DB.';

create or replace function public.protect_profile_type()
returns trigger
language plpgsql
as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.profile_type := old.profile_type;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_profile_type on public.profiles;

create trigger profiles_protect_profile_type
before update on public.profiles
for each row
execute function public.protect_profile_type();

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
  profile_type text,
  email text,
  email_verified boolean,
  stripe_account_id text,
  stripe_details_submitted boolean,
  stripe_charges_enabled boolean,
  stripe_payouts_enabled boolean,
  stripe_verification_status text
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
    p.profile_type,
    p.email,
    p.email_verified,
    p.stripe_account_id,
    p.stripe_details_submitted,
    p.stripe_charges_enabled,
    p.stripe_payouts_enabled,
    p.stripe_verification_status
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.get_current_profile() from public;
grant execute on function public.get_current_profile() to authenticated;
