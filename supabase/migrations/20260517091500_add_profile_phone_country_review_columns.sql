alter table public.profiles
  add column if not exists phone_country_code text,
  add column if not exists security_review_required boolean not null default false;

create index if not exists idx_profiles_security_review_required
  on public.profiles(security_review_required);
