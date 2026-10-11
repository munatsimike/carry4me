-- Privilege tests for delivery_otp_hash column lockdown.
-- Run after migrations: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f this file
-- Wrapped in a transaction that always rolls back.

begin;

do $$
declare
  table_select_grants int;
  public_select_grants int;
  hash_col_grants int;
  frontend_col text;
  frontend_cols text[] := array[
    'id',
    'parcel_id',
    'trip_id',
    'sender_user_id',
    'traveler_user_id',
    'initiator_role',
    'status',
    'payment_preference',
    'parcel_snapshot',
    'trip_snapshot',
    'payment_expires_at',
    'expired_at',
    'created_at',
    'updated_at',
    'stripe_payment_intent_id',
    'payment_status',
    'delivery_otp_expires_at',
    'delivery_otp_attempts',
    'delivery_otp_verified_at',
    'delivery_otp_last_sent_at'
  ];
begin
  if has_column_privilege(
    'authenticated',
    'public.carry_requests',
    'delivery_otp_hash',
    'SELECT'
  ) then
    raise exception 'authenticated can SELECT delivery_otp_hash';
  end if;

  if has_column_privilege(
    'anon',
    'public.carry_requests',
    'delivery_otp_hash',
    'SELECT'
  ) then
    raise exception 'anon can SELECT delivery_otp_hash';
  end if;

  if not has_column_privilege(
    'service_role',
    'public.carry_requests',
    'delivery_otp_hash',
    'SELECT'
  ) then
    raise exception 'service_role lost SELECT on delivery_otp_hash';
  end if;

  if not has_table_privilege('authenticated', 'public.carry_requests', 'INSERT') then
    raise exception 'authenticated lost INSERT on carry_requests';
  end if;

  if has_table_privilege('authenticated', 'public.carry_requests', 'UPDATE') then
    raise exception 'authenticated regained UPDATE on carry_requests';
  end if;

  if has_table_privilege('authenticated', 'public.carry_requests', 'DELETE') then
    raise exception 'authenticated regained DELETE on carry_requests';
  end if;

  if not has_table_privilege('service_role', 'public.carry_requests', 'SELECT')
    or not has_table_privilege('service_role', 'public.carry_requests', 'INSERT')
    or not has_table_privilege('service_role', 'public.carry_requests', 'UPDATE')
    or not has_table_privilege('service_role', 'public.carry_requests', 'DELETE')
  then
    raise exception 'service_role lost full DML on carry_requests';
  end if;

  select count(*)
  into table_select_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'carry_requests'
    and grantee = 'authenticated'
    and privilege_type = 'SELECT';

  if table_select_grants <> 0 then
    raise exception
      'authenticated still has table-level SELECT on carry_requests (count=%)',
      table_select_grants;
  end if;

  select count(*)
  into public_select_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'carry_requests'
    and grantee in ('PUBLIC', 'anon')
    and privilege_type = 'SELECT';

  if public_select_grants <> 0 then
    raise exception 'PUBLIC/anon still have table-level SELECT on carry_requests';
  end if;

  select count(*)
  into hash_col_grants
  from information_schema.column_privileges
  where table_schema = 'public'
    and table_name = 'carry_requests'
    and column_name = 'delivery_otp_hash'
    and privilege_type = 'SELECT'
    and grantee in ('PUBLIC', 'anon', 'authenticated');

  if hash_col_grants <> 0 then
    raise exception 'delivery_otp_hash still has client SELECT grants';
  end if;

  foreach frontend_col in array frontend_cols
  loop
    if not has_column_privilege(
      'authenticated',
      'public.carry_requests',
      frontend_col,
      'SELECT'
    ) then
      raise exception 'authenticated cannot SELECT % (frontend query)', frontend_col;
    end if;
  end loop;

  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'carry_requests'
      and c.relrowsecurity
      and not c.relforcerowsecurity
  ) then
    raise exception 'carry_requests RLS must stay enabled without FORCE';
  end if;

  if not exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'carry_requests'
      and pol.polname = 'carry_requests_select_participant'
      and pol.polcmd = 'r'
  ) then
    raise exception 'carry_requests_select_participant SELECT policy missing';
  end if;

  if not exists (
    select 1
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'carry_requests'
      and pol.polname = 'carry_requests_update_blocked'
  ) then
    raise exception 'carry_requests_update_blocked policy missing';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.hash_delivery_otp(uuid, text)',
    'EXECUTE'
  ) then
    raise exception 'authenticated can EXECUTE hash_delivery_otp';
  end if;

  if has_function_privilege(
    'anon',
    'public.hash_delivery_otp(uuid, text)',
    'EXECUTE'
  ) then
    raise exception 'anon can EXECUTE hash_delivery_otp';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.issue_delivery_otp(uuid)',
    'EXECUTE'
  ) then
    raise exception 'authenticated can EXECUTE issue_delivery_otp';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.issue_delivery_otp(uuid)',
    'EXECUTE'
  ) then
    raise exception 'service_role lost EXECUTE on issue_delivery_otp';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.verify_delivery_otp(uuid, text)',
    'EXECUTE'
  ) then
    raise exception 'authenticated lost EXECUTE on verify_delivery_otp';
  end if;

  if (
    select array_agg(a.attname order by a.attname)
    from pg_attribute a
    where a.attrelid = 'public.carry_requests'::regclass
      and a.attnum > 0
      and not a.attisdropped
      and not has_column_privilege(
        'authenticated',
        'public.carry_requests',
        a.attname,
        'SELECT'
      )
  ) is distinct from array['delivery_otp_hash'::name]
  then
    raise exception 'authenticated SELECT denylist is not exactly delivery_otp_hash';
  end if;
end;
$$;

-- Ordinary participant role cannot name the hash column, even with zero rows.
set local role authenticated;

do $$
begin
  begin
    perform delivery_otp_hash from public.carry_requests;
    raise exception 'authenticated SELECT delivery_otp_hash did not fail';
  exception
    when insufficient_privilege then
      null;
  end;
end;
$$;

-- Normal listing query columns remain readable under RLS.
do $$
declare
  n int;
begin
  select count(*) into n
  from public.carry_requests
  where false;

  perform id, status, sender_user_id, traveler_user_id, payment_status
  from public.carry_requests
  where false;
end;
$$;

reset role;

-- Table owner / SECURITY DEFINER path still sees the hash column.
do $$
begin
  perform delivery_otp_hash from public.carry_requests where false;
end;
$$;

do $$
begin
  raise notice 'carry_requests OTP hash SELECT lockdown passed';
end;
$$;

rollback;
