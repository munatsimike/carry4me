-- Secure delivery OTP for payment release (hashed at rest, verified server-side).

-- Supabase installs pgcrypto in the extensions schema (not public).
create extension if not exists pgcrypto with schema extensions;

alter table public.carry_requests
  add column if not exists delivery_otp_hash text,
  add column if not exists delivery_otp_expires_at timestamptz,
  add column if not exists delivery_otp_attempts integer not null default 0,
  add column if not exists delivery_otp_verified_at timestamptz,
  add column if not exists delivery_otp_last_sent_at timestamptz;

comment on column public.carry_requests.delivery_otp_hash is
  'SHA-256 hash of carry_request_id + 6-digit OTP. Never expose to clients.';
comment on column public.carry_requests.delivery_otp_verified_at is
  'Set when traveler successfully verifies sender delivery OTP before payout release.';

-- Internal: cryptographically secure 6-digit OTP (000000–999999).
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

-- Issue OTP to sender (email/notification). Called on MARK_DELIVERED and resend.
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

  -- Plain OTP returned only to security definer callers (edge function / dev).
  return jsonb_build_object(
    'ok', true,
    'otp', v_otp,
    'expires_at', v_expires
  );
end;
$$;

revoke all on function public.issue_delivery_otp(uuid) from public;
grant execute on function public.issue_delivery_otp(uuid) to service_role;

-- Verify OTP submitted by traveler before RELEASE_PAYMENT.
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

-- Gate RELEASE_PAYMENT on OTP verification + successful payment; issue OTP on MARK_DELIVERED.
create or replace function public.perform_carry_request_action(
  request_id uuid,
  action_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cr record;

  actor_role text;
  recipient_role text;
  recipient_id uuid;

  next_status text;
  event_type text;

  sender_confirmed boolean;
  traveler_confirmed boolean;

  new_payment_expires_at timestamptz := null;
  new_expired_at timestamptz := null;

  payment_window_minutes integer;
  otp_issue jsonb;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if public.current_account_status() = 'suspended' then
    return jsonb_build_object('ok', false, 'reason', 'ACCOUNT_SUSPENDED');
  end if;

  select * into cr
  from public.carry_requests
  where id = request_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;

  if uid <> cr.sender_user_id and uid <> cr.traveler_user_id then
    return jsonb_build_object('ok', false, 'reason', 'FORBIDDEN');
  end if;

  actor_role := case when uid = cr.sender_user_id then 'SENDER' else 'TRAVELER' end;
  recipient_id := case when uid = cr.sender_user_id then cr.traveler_user_id else cr.sender_user_id end;
  recipient_role := case when uid = cr.sender_user_id then 'TRAVELER' else 'SENDER' end;

  select value::int
  into payment_window_minutes
  from public.platform_settings
  where key = 'payment_window_minutes';

  if payment_window_minutes is null then
    payment_window_minutes := 10;
  end if;

  if action_key = 'ACCEPT' then
    if cr.status <> 'PENDING_ACCEPTANCE' then
      return jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
    end if;

    next_status := 'PENDING_PAYMENT';
    event_type := 'REQUEST_ACCEPTED';
    new_payment_expires_at :=
      now() + (payment_window_minutes || ' minutes')::interval;

  elsif action_key = 'REJECT' then
    if cr.status <> 'PENDING_ACCEPTANCE' then
      return jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
    end if;

    next_status := 'REJECTED';
    event_type := 'REQUEST_REJECTED';

  elsif action_key = 'CANCEL' then
    if cr.status not in ('PENDING_ACCEPTANCE','PENDING_PAYMENT','PENDING_HANDOVER') then
      return jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
    end if;

    next_status := 'CANCELLED';
    event_type := 'REQUEST_CANCELED';

  elsif action_key = 'PAY' then
    if cr.status <> 'PENDING_PAYMENT' then
      return jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
    end if;

    if actor_role <> 'SENDER' then
      return jsonb_build_object('ok', false, 'reason', 'ONLY_SENDER_CAN_PAY');
    end if;

    if cr.payment_expires_at is not null
       and cr.payment_expires_at <= now() then
      return jsonb_build_object('ok', false, 'reason', 'PAYMENT_EXPIRED');
    end if;

    if cr.stripe_payment_intent_id is not null
       and coalesce(cr.payment_status, '') <> 'SUCCEEDED' then
      return jsonb_build_object('ok', false, 'reason', 'PAYMENT_NOT_CONFIRMED');
    end if;

    next_status := 'PENDING_HANDOVER';
    event_type := 'PAYMENT_COMPLETED';

  elsif action_key = 'CONFIRM_HANDOVER' then
    if cr.status <> 'PENDING_HANDOVER' then
      return jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
    end if;

    insert into public.carry_request_handover_confirmations (
      carry_request_id,
      user_id,
      role,
      confirmed_at
    )
    values (request_id, uid, actor_role::handover_role, now())
    on conflict (carry_request_id, role)
    do update set user_id = excluded.user_id, confirmed_at = excluded.confirmed_at;

    select
      count(*) filter (where role = 'SENDER') > 0,
      count(*) filter (where role = 'TRAVELER') > 0
    into sender_confirmed, traveler_confirmed
    from public.carry_request_handover_confirmations
    where carry_request_id = request_id
      and confirmed_at is not null;

    if not (sender_confirmed and traveler_confirmed) then
      if not exists (
        select 1
        from public.carry_request_events e
        where e.carry_request_id = request_id
          and e.type = 'HANDOVER_CONFIRMED'
          and e.actor_user_id = uid
      ) then
        insert into public.carry_request_events (
          carry_request_id,
          type,
          actor_user_id,
          metadata
        )
        values (request_id, 'HANDOVER_CONFIRMED', uid, '{}'::jsonb);
      end if;

      return jsonb_build_object(
        'ok', true,
        'action', action_key,
        'progressed', false,
        'waiting_for', case when sender_confirmed then 'TRAVELER' else 'SENDER' end
      );
    end if;

    next_status := 'IN_TRANSIT';
    event_type := 'PARCEL_RECEIVED';

  elsif action_key = 'MARK_DELIVERED' then
    if cr.status <> 'IN_TRANSIT' then
      return jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
    end if;

    if actor_role <> 'TRAVELER' then
      return jsonb_build_object('ok', false, 'reason', 'ONLY_TRAVELER_CAN_MARK_DELIVERED');
    end if;

    next_status := 'PENDING_PAYOUT';
    event_type := 'PARCEL_DELIVERED';

  elsif action_key = 'RELEASE_PAYMENT' then
    if cr.status = 'PAID_OUT' then
      return jsonb_build_object(
        'ok', true,
        'action', action_key,
        'new_status', cr.status,
        'progressed', false,
        'reason', 'ALREADY_PAID_OUT'
      );
    end if;

    if cr.status <> 'PENDING_PAYOUT' then
      return jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
    end if;

    if actor_role <> 'TRAVELER' then
      return jsonb_build_object('ok', false, 'reason', 'ONLY_TRAVELER_CAN_RELEASE');
    end if;

    if cr.delivery_otp_verified_at is null then
      return jsonb_build_object(
        'ok', false,
        'reason', 'OTP_NOT_VERIFIED',
        'message', 'Enter the sender''s 6-digit delivery code before releasing payment.'
      );
    end if;

    if cr.stripe_payment_intent_id is not null
       and coalesce(cr.payment_status, '') <> 'SUCCEEDED' then
      return jsonb_build_object('ok', false, 'reason', 'PAYMENT_NOT_CONFIRMED');
    end if;

    next_status := 'PAID_OUT';
    event_type := 'PAYMENT_RELEASED';

  else
    return jsonb_build_object('ok', false, 'reason', 'NOT_IMPLEMENTED');
  end if;

  update public.carry_requests
  set status = next_status,
      payment_expires_at = coalesce(new_payment_expires_at, payment_expires_at),
      expired_at = new_expired_at,
      updated_at = now()
  where id = request_id;

  insert into public.carry_request_events (carry_request_id, type, actor_user_id, metadata)
  values (request_id, event_type, uid, '{}'::jsonb);

  if action_key = 'MARK_DELIVERED' then
    otp_issue := public.issue_delivery_otp(request_id);
    if coalesce((otp_issue->>'ok')::boolean, false) is not true then
      raise warning 'issue_delivery_otp failed for %: %', request_id, otp_issue;
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'action', action_key,
    'event_type', event_type,
    'new_status', next_status,
    'payment_expires_at', new_payment_expires_at,
    'progressed', true
  );
end;
$$;

revoke execute on function public.perform_carry_request_action(uuid, text) from public;
grant execute on function public.perform_carry_request_action(uuid, text) to authenticated;
