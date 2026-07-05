-- SQL Editor runs as postgres, not service_role. Allow DB admins to set profile_type.

create or replace function public.protect_profile_type()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role'
     or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  new.profile_type := old.profile_type;
  return new;
end;
$$;

create or replace function public.protect_profile_country()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role'
     or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if coalesce(old.profile_type, 'ordinary') <> 'admin' then
    new.country := old.country;
    new.country_code := old.country_code;
  end if;

  return new;
end;
$$;
