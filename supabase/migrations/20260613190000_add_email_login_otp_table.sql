-- Custom email OTP login support (Resend-based).
-- Stores only hashed OTP values with expiry/attempt/cooldown controls.

create table if not exists public.email_login_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_hash text not null,
  otp_salt text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 5 check (max_attempts > 0),
  cooldown_until timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_login_otps_email_created_idx
  on public.email_login_otps (email, created_at desc);

create index if not exists email_login_otps_expires_idx
  on public.email_login_otps (expires_at);

-- RLS hardening: this table is only for service-role edge functions.
alter table public.email_login_otps enable row level security;

drop policy if exists email_login_otps_block_all_select
  on public.email_login_otps;
create policy email_login_otps_block_all_select
on public.email_login_otps
for select
to public
using (false);

drop policy if exists email_login_otps_block_all_write
  on public.email_login_otps;
create policy email_login_otps_block_all_write
on public.email_login_otps
for all
to public
using (false)
with check (false);
