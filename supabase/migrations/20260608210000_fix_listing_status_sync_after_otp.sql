-- Re-apply latest perform_carry_request_action logic in a NEW migration.
-- Needed because 20260608130000 was already applied remotely.

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
  old_request_status text;

  actor_role text;

  next_status text;
  event_type text;

  sender_confirmed boolean;
  traveler_confirmed boolean;

  new_payment_expires_at timestamptz := null;
  new_expired_at timestamptz := null;

  payment_window_minutes integer;
  otp_issue jsonb;
  v_capacity jsonb := '{}'::jsonb;
  v_capacity_action text := 'none';
  v_parcel_status text;
  v_trip_status text;
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

  old_request_status := cr.status;
  actor_role := case when uid = cr.sender_user_id then 'SENDER' else 'TRAVELER' end;

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
    v_capacity := public.reserve_trip_capacity_for_request(request_id);

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

      v_parcel_status := public.sync_parcel_status_after_request_action(
        request_id,
        action_key,
        cr.status
      );
      v_trip_status := public.recalculate_trip_status(cr.trip_id);

      return jsonb_build_object(
        'ok', true,
        'action', action_key,
        'progressed', false,
        'waiting_for', case when sender_confirmed then 'TRAVELER' else 'SENDER' end,
        'old_request_status', old_request_status,
        'trip_id', cr.trip_id,
        'parcel_id', cr.parcel_id,
        'trip_status', v_trip_status,
        'parcel_status', v_parcel_status,
        'capacity_action', 'none'
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

  if action_key = 'ACCEPT' then
    v_capacity_action := coalesce(v_capacity ->> 'capacity_action', 'none');
    v_trip_status := coalesce(
      v_capacity ->> 'trip_status',
      public.recalculate_trip_status(cr.trip_id)
    );
  elsif action_key = 'CANCEL' then
    v_capacity := public.restore_trip_capacity_for_request(request_id);
    v_capacity_action := coalesce(v_capacity ->> 'capacity_action', 'none');
    v_trip_status := coalesce(
      v_capacity ->> 'trip_status',
      public.recalculate_trip_status(cr.trip_id)
    );
  elsif action_key = 'RELEASE_PAYMENT' then
    v_capacity := public.consume_trip_capacity_for_request(request_id);
    v_capacity_action := coalesce(v_capacity ->> 'capacity_action', 'none');
    v_trip_status := coalesce(
      v_capacity ->> 'trip_status',
      public.recalculate_trip_status(cr.trip_id)
    );
  else
    v_trip_status := public.recalculate_trip_status(cr.trip_id);
  end if;

  v_parcel_status := public.sync_parcel_status_after_request_action(
    request_id,
    action_key,
    next_status
  );

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
    'old_request_status', old_request_status,
    'new_status', next_status,
    'payment_expires_at', new_payment_expires_at,
    'progressed', true,
    'trip_status', v_trip_status,
    'parcel_status', v_parcel_status,
    'capacity_action', v_capacity_action
  );
end;
$$;

revoke execute on function public.perform_carry_request_action(uuid, text) from public;
grant execute on function public.perform_carry_request_action(uuid, text) to authenticated;

