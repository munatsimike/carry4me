-- =========================
-- 1) Add new profile columns
-- =========================
alter table public.profiles
  add column if not exists country_code text,
  add column if not exists city text,
  add column if not exists phone_number text,
  add column if not exists phone_visible_to_matches boolean not null default false;

-- Optional: basic validation for country_code (ISO-3166 alpha-2 style)
-- (Allows NULL; enforces 2 letters when provided)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_country_code_len'
  ) then
    alter table public.profiles
      add constraint profiles_country_code_len
      check (country_code is null or char_length(country_code) = 2);
  end if;
end $$;

-- ======================================
-- 2) Keep updated_at current on update
-- ======================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- =======================================================
-- 3) Create a profile automatically when a new auth user is created
-- =======================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    avatar_url,
    country_code,
    city,
    phone_number
  )
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    nullif(new.raw_user_meta_data->>'country_code', ''),
    nullif(new.raw_user_meta_data->>'city', ''),
    nullif(new.raw_user_meta_data->>'phone_number', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();