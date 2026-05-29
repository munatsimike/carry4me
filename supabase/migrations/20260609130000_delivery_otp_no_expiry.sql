-- Delivery/payment release OTPs do not expire; payout still requires traveler auth + correct code.

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
  v_expires timestamptz := '2099-12-31T23:59:59.999Z'::timestamptz;
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
    'Share this 6-digit code with your traveler to release payment: ' || v_otp || '.',
    '/requests',
    jsonb_build_object(
      'carry_request_id', p_request_id
    )
  )
  returning id into notification_id;

  insert into public.email_queue (notification_id, user_id)
  values (notification_id, cr.sender_user_id);

  return jsonb_build_object(
    'ok', true,
    'otp', v_otp
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

-- Extend any active codes that were issued under the old 15-minute window.
update public.carry_requests
set delivery_otp_expires_at = '2099-12-31T23:59:59.999Z'::timestamptz,
    updated_at = now()
where delivery_otp_hash is not null
  and delivery_otp_verified_at is null
  and delivery_otp_expires_at is not null
  and delivery_otp_expires_at <= now() + interval '100 years';
