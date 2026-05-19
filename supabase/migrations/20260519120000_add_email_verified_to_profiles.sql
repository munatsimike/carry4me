alter table public.profiles
add column if not exists email_verified boolean not null default false;
