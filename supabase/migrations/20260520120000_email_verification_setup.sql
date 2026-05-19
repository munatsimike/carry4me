-- Email verification tokens (service role / edge functions only)
create table if not exists public.email_verification_tokens (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists email_verification_tokens_user_id_idx
  on public.email_verification_tokens (user_id);

create index if not exists email_verification_tokens_expires_at_idx
  on public.email_verification_tokens (expires_at);

alter table public.email_verification_tokens enable row level security;

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
  email_verified boolean
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
    p.email_verified
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.get_current_profile() from public;
grant execute on function public.get_current_profile() to authenticated;
