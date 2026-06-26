-- Stripe Connect: one account per user, expose status on profile RPC.

create unique index if not exists profiles_stripe_account_id_unique_idx
  on public.profiles (stripe_account_id)
  where stripe_account_id is not null;

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

comment on index public.profiles_stripe_account_id_unique_idx is
  'Each Stripe Connect account can belong to at most one Carry4Me user.';
