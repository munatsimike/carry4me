-- Delivery OTP must not be readable from notifications or client tables.
begin;

do $$
begin
  if has_table_privilege('authenticated', 'public.delivery_otp_email_secrets', 'SELECT') then
    raise exception 'authenticated can SELECT delivery_otp_email_secrets';
  end if;

  if has_table_privilege('anon', 'public.delivery_otp_email_secrets', 'SELECT') then
    raise exception 'anon can SELECT delivery_otp_email_secrets';
  end if;

  if has_table_privilege('authenticated', 'public.delivery_otp_email_secrets', 'INSERT') then
    raise exception 'authenticated can INSERT delivery_otp_email_secrets';
  end if;

  if not has_table_privilege('service_role', 'public.delivery_otp_email_secrets', 'SELECT') then
    raise exception 'service_role lost SELECT on delivery_otp_email_secrets';
  end if;

  if not has_table_privilege('service_role', 'public.delivery_otp_email_secrets', 'INSERT') then
    raise exception 'service_role lost INSERT on delivery_otp_email_secrets';
  end if;

  if exists (
    select 1
    from public.notifications
    where metadata ? 'otp'
  ) then
    raise exception 'notifications.metadata still contains otp';
  end if;

  if exists (
    select 1
    from public.notifications
    where type = 'DELIVERY_OTP'
      and body ~ '\d{6}'
  ) then
    raise exception 'DELIVERY_OTP notification body still contains digits';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.issue_delivery_otp(uuid)',
    'EXECUTE'
  ) then
    raise exception 'authenticated can EXECUTE issue_delivery_otp';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.verify_delivery_otp(uuid, text)',
    'EXECUTE'
  ) then
    raise exception 'authenticated lost EXECUTE on verify_delivery_otp';
  end if;

  if has_column_privilege(
    'authenticated',
    'public.carry_requests',
    'delivery_otp_hash',
    'SELECT'
  ) then
    raise exception 'authenticated can SELECT delivery_otp_hash';
  end if;
end;
$$;

set local role authenticated;

do $$
begin
  begin
    perform otp from public.delivery_otp_email_secrets;
    raise exception 'authenticated SELECT delivery_otp_email_secrets did not fail';
  exception
    when insufficient_privilege then
      null;
    when undefined_table then
      raise exception 'delivery_otp_email_secrets missing';
  end;
end;
$$;

reset role;

do $$
begin
  raise notice 'delivery OTP email privacy passed';
end;
$$;

rollback;
