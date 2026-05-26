-- Catch-up migration: ensure OTP objects reflect latest logic even if
-- 20260608130000 was edited after first apply.

create extension if not exists pgcrypto with schema extensions;

alter table public.carry_requests
  add column if not exists delivery_otp_hash text,
  add column if not exists delivery_otp_expires_at timestamptz,
  add column if not exists delivery_otp_attempts integer not null default 0,
  add column if not exists delivery_otp_verified_at timestamptz,
  add column if not exists delivery_otp_last_sent_at timestamptz;

create or replace function public.generate_secure_otp_6()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_bytes bytea;
  n bigint;
begin
  v_bytes := extensions.gen_random_bytes(4);
  n :=
    get_byte(v_bytes, 0)::bigint * 16777216 +
    get_byte(v_bytes, 1)::bigint * 65536 +
    get_byte(v_bytes, 2)::bigint * 256 +
    get_byte(v_bytes, 3)::bigint;
  n := abs(n) % 1000000;
  return lpad(n::text, 6, '0');
end;
$$;

revoke all on function public.generate_secure_otp_6() from public;

create or replace function public.hash_delivery_otp(
  p_request_id uuid,
  p_otp text
)
returns text
language sql
security definer
set search_path = public, extensions
as $$
  select encode(
    extensions.digest(p_request_id::text || ':' || p_otp, 'sha256'),
    'hex'
  );
$$;

revoke all on function public.hash_delivery_otp(uuid, text) from public;

create or replace function public.issue_delivery_otp(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cr record;
  v_otp text;
  v_hash text;
  v_expires timestamptz := now() + interval '15 minutes';
  notification_id uuid;
begin
  select * into cr
  from public.carry_requests
  where id = p_request_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;

  if cr.status not in ('IN_TRANSIT', 'PENDING_PAYOUT') then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
  end if;

  v_otp := public.generate_secure_otp_6();
  v_hash := public.hash_delivery_otp(p_request_id, v_otp);

  update public.carry_requests
  set
    delivery_otp_hash = v_hash,
    delivery_otp_expires_at = v_expires,
    delivery_otp_attempts = 0,
    delivery_otp_verified_at = null,
    delivery_otp_last_sent_at = now(),
    updated_at = now()
  where id = p_request_id;

  insert into public.notifications (user_id, type, title, body, link, metadata)
  values (
    cr.sender_user_id,
    'DELIVERY_OTP',
    'Your payment release code',
    'Share this 6-digit code with your traveler to release payment: ' || v_otp ||
      '. It expires in 15 minutes.',
    '/requests',
    jsonb_build_object(
      'carry_request_id', p_request_id,
      'expires_at', v_expires
    )
  )
  returning id into notification_id;

  insert into public.email_queue (notification_id, user_id)
  values (notification_id, cr.sender_user_id);

  return jsonb_build_object(
    'ok', true,
    'otp', v_otp,
    'expires_at', v_expires
  );
end;
$$;

revoke all on function public.issue_delivery_otp(uuid) from public;
grant execute on function public.issue_delivery_otp(uuid) to service_role;

create or replace function public.verify_delivery_otp(
  p_request_id uuid,
  p_otp text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cr record;
  max_attempts constant integer := 5;
  otp_digits text;
  expected_hash text;
  attempts_remaining integer;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'reason', 'NOT_AUTHENTICATED');
  end if;

  select * into cr
  from public.carry_requests
  where id = p_request_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;

  if uid <> cr.traveler_user_id then
    return jsonb_build_object('ok', false, 'reason', 'FORBIDDEN');
  end if;

  if cr.status <> 'PENDING_PAYOUT' then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
  end if;

  if cr.delivery_otp_verified_at is not null then
    return jsonb_build_object('ok', true, 'reason', 'ALREADY_VERIFIED');
  end if;

  if cr.delivery_otp_hash is null then
    return jsonb_build_object('ok', false, 'reason', 'OTP_NOT_GENERATED');
  end if;

  if cr.delivery_otp_expires_at is null or cr.delivery_otp_expires_at <= now() then
    return jsonb_build_object(
      'ok', false,
      'reason', 'OTP_EXPIRED',
      'message', 'This code has expired. Ask the sender to request a new code.'
    );
  end if;

  if cr.delivery_otp_attempts >= max_attempts then
    return jsonb_build_object(
      'ok', false,
      'reason', 'OTP_ATTEMPTS_EXCEEDED',
      'message', 'Too many failed attempts. Request a new code from the sender.'
    );
  end if;

  otp_digits := regexp_replace(trim(coalesce(p_otp, '')), '\D', '', 'g');

  if length(otp_digits) <> 6 then
    update public.carry_requests
    set delivery_otp_attempts = delivery_otp_attempts + 1,
        updated_at = now()
    where id = p_request_id;

    select greatest(0, max_attempts - delivery_otp_attempts)
    into attempts_remaining
    from public.carry_requests
    where id = p_request_id;

    return jsonb_build_object(
      'ok', false,
      'reason', 'OTP_INVALID',
      'message', 'Enter the 6-digit code from the sender.',
      'attempts_remaining', attempts_remaining
    );
  end if;

  expected_hash := public.hash_delivery_otp(p_request_id, otp_digits);

  if cr.delivery_otp_hash is distinct from expected_hash then
    update public.carry_requests
    set delivery_otp_attempts = delivery_otp_attempts + 1,
        updated_at = now()
    where id = p_request_id;

    select greatest(0, max_attempts - delivery_otp_attempts)
    into attempts_remaining
    from public.carry_requests
    where id = p_request_id;

    return jsonb_build_object(
      'ok', false,
      'reason', 'OTP_INVALID',
      'message', 'Incorrect code. Please try again.',
      'attempts_remaining', attempts_remaining
    );
  end if;

  update public.carry_requests
  set delivery_otp_verified_at = now(),
      updated_at = now()
  where id = p_request_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.verify_delivery_otp(uuid, text) from public;
grant execute on function public.verify_delivery_otp(uuid, text) to authenticated;

