-- Parcel lifecycle: MATCHED from ACCEPT through delivery; ARCHIVED only on PAID_OUT.
-- OPEN on REJECT / CANCEL / PAYMENT_EXPIRED. Trip lifecycle unchanged.

drop function if exists public.update_parcel_status_for_request(uuid, text);

create or replace function public.update_parcel_status_for_request(
  p_request_id uuid,
  p_new_status text,
  p_allow_archive boolean default false
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parcel_id uuid;
  v_current text;
  v_target public.parcel_status;
begin
  select cr.parcel_id, p.status::text
  into v_parcel_id, v_current
  from public.carry_requests cr
  join public.parcels p on p.id = cr.parcel_id
  where cr.id = p_request_id;

  if not found then
    return null;
  end if;

  v_target := p_new_status::public.parcel_status;

  if v_target = 'ARCHIVED'::public.parcel_status and not p_allow_archive then
    return v_current;
  end if;

  if v_current = 'ARCHIVED' and v_target <> 'ARCHIVED'::public.parcel_status then
    return v_current;
  end if;

  update public.parcels
  set status = v_target,
      updated_at = now()
  where id = v_parcel_id;

  return v_target::text;
end;
$$;

revoke all on function public.update_parcel_status_for_request(uuid, text, boolean) from public;

-- Central parcel status rules for carry-request actions.
create or replace function public.sync_parcel_status_after_request_action(
  p_request_id uuid,
  p_action_key text,
  p_new_request_status text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Final completion only.
  if p_action_key = 'RELEASE_PAYMENT' or p_new_request_status = 'PAID_OUT' then
    return public.update_parcel_status_for_request(p_request_id, 'ARCHIVED', true);
  end if;

  -- Reopen marketplace listing.
  if p_action_key in ('REJECT', 'CANCEL')
     or p_new_request_status in ('EXPIRED', 'REJECTED', 'CANCELLED') then
    return public.update_parcel_status_for_request(p_request_id, 'OPEN', false);
  end if;

  -- In-flight shipment: stay off marketplace until PAID_OUT.
  if p_action_key in ('ACCEPT', 'PAY', 'CONFIRM_HANDOVER', 'MARK_DELIVERED')
     or p_new_request_status in (
       'PENDING_PAYMENT',
       'PENDING_HANDOVER',
       'IN_TRANSIT',
       'PENDING_PAYOUT'
     ) then
    return public.update_parcel_status_for_request(p_request_id, 'MATCHED', false);
  end if;

  return (
    select p.status::text
    from public.carry_requests cr
    join public.parcels p on p.id = cr.parcel_id
    where cr.id = p_request_id
  );
end;
$$;

revoke all on function public.sync_parcel_status_after_request_action(uuid, text, text) from public;

-- Payment expiry: parcel returns to OPEN (not ARCHIVED).
create or replace function public.expire_overdue_carry_requests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer := 0;
  r record;
begin
  perform public.archive_past_trips();

  for r in
    select cr.id, cr.trip_id, cr.sender_user_id, cr.traveler_user_id
    from public.carry_requests cr
    where cr.status = 'PENDING_PAYMENT'
      and cr.payment_expires_at is not null
      and cr.payment_expires_at <= now()
    for update of cr
  loop
    update public.carry_requests
    set status = 'EXPIRED',
        expired_at = now(),
        payment_expires_at = null,
        updated_at = now()
    where id = r.id;

    perform public.restore_trip_capacity_for_request(r.id);
    perform public.sync_parcel_status_after_request_action(r.id, 'EXPIRED', 'EXPIRED');
    perform public.recalculate_trip_status(r.trip_id);

    insert into public.carry_request_events (
      carry_request_id,
      type,
      actor_user_id,
      metadata
    )
    values (r.id, 'REQUEST_EXPIRED', null, '{}'::jsonb);

    insert into public.notifications (user_id, type, title, body, link, metadata)
    select
      r.sender_user_id,
      'REQUEST_EXPIRED',
      tpl.title,
      tpl.body,
      tpl.link,
      jsonb_build_object('carry_request_id', r.id)
    from public.get_carry_request_notification_template(
      'REQUEST_EXPIRED',
      'SENDER',
      'TRAVELER'
    ) tpl;

    insert into public.notifications (user_id, type, title, body, link, metadata)
    select
      r.traveler_user_id,
      'REQUEST_EXPIRED',
      tpl.title,
      tpl.body,
      tpl.link,
      jsonb_build_object('carry_request_id', r.id)
    from public.get_carry_request_notification_template(
      'REQUEST_EXPIRED',
      'TRAVELER',
      'SENDER'
    ) tpl;

    expired_count := expired_count + 1;
  end loop;

  return expired_count;
end;
$$;

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
  recipient_id uuid;

  next_status text;
  event_type text;
  old_request_status text;

  sender_confirmed boolean;
  traveler_confirmed boolean;

  new_payment_expires_at timestamptz := null;
  new_expired_at timestamptz := null;

  payment_window_minutes integer;

  v_capacity jsonb := '{}'::jsonb;
  v_capacity_action text := 'none';
  v_parcel_status text;
  v_trip_status text;
  v_reserved_kg numeric;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if public.current_account_status() = 'suspended' then
    return jsonb_build_object('ok', false, 'reason', 'ACCOUNT_SUSPENDED');
  end if;

  perform public.archive_past_trips();

  select * into cr
  from public.carry_requests
  where id = request_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;

  if uid <> cr.sender_user_id and uid <> cr.traveler_user_id then
    return jsonb_build_object('ok', false, 'reason', 'FORBIDDEN');
  end if;

  old_request_status := cr.status;
  actor_role := case when uid = cr.sender_user_id then 'SENDER' else 'TRAVELER' end;
  recipient_id := case when uid = cr.sender_user_id then cr.traveler_user_id else cr.sender_user_id end;

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

    v_capacity := public.reserve_trip_capacity_for_request(request_id);
    if coalesce((v_capacity ->> 'ok')::boolean, false) = false then
      return jsonb_build_object(
        'ok', false,
        'reason', coalesce(v_capacity ->> 'reason', 'RESERVE_FAILED'),
        'request_id', request_id,
        'action', action_key,
        'old_request_status', old_request_status
      );
    end if;
    v_capacity_action := coalesce(v_capacity ->> 'capacity_action', 'reserved');

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
        'request_id', request_id,
        'old_request_status', old_request_status,
        'trip_id', cr.trip_id,
        'parcel_id', cr.parcel_id,
        'parcel_status', v_parcel_status,
        'trip_status', v_trip_status,
        'reserved_kg', cr.reserved_kg,
        'capacity_action', 'none'
      );
    end if;

    next_status := 'IN_TRANSIT';
    event_type := 'PARCEL_RECEIVED';

  elsif action_key = 'MARK_DELIVERED' then
    if cr.status <> 'IN_TRANSIT' then
      return jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
    end if;

    next_status := 'PENDING_PAYOUT';
    event_type := 'PARCEL_DELIVERED';

  elsif action_key = 'RELEASE_PAYMENT' then
    if cr.status <> 'PENDING_PAYOUT' then
      return jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
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

  -- Trip capacity (unchanged).
  if action_key = 'ACCEPT' then
    v_trip_status := coalesce(v_capacity ->> 'trip_status', public.recalculate_trip_status(cr.trip_id));
  elsif action_key = 'CANCEL' then
    v_capacity := public.restore_trip_capacity_for_request(request_id);
    v_capacity_action := coalesce(v_capacity ->> 'capacity_action', 'none');
    v_trip_status := coalesce(v_capacity ->> 'trip_status', public.recalculate_trip_status(cr.trip_id));
  elsif action_key = 'RELEASE_PAYMENT' then
    v_capacity := public.consume_trip_capacity_for_request(request_id);
    v_capacity_action := coalesce(v_capacity ->> 'capacity_action', 'none');
    v_trip_status := coalesce(v_capacity ->> 'trip_status', public.recalculate_trip_status(cr.trip_id));
  elsif action_key not in ('REJECT') then
    v_trip_status := public.recalculate_trip_status(cr.trip_id);
  else
    v_trip_status := public.recalculate_trip_status(cr.trip_id);
  end if;

  v_parcel_status := public.sync_parcel_status_after_request_action(
    request_id,
    action_key,
    next_status
  );

  select reserved_kg into v_reserved_kg
  from public.carry_requests
  where id = request_id;

  return jsonb_build_object(
    'ok', true,
    'action', action_key,
    'event_type', event_type,
    'old_request_status', old_request_status,
    'new_status', next_status,
    'payment_expires_at', new_payment_expires_at,
    'progressed', true,
    'request_id', request_id,
    'trip_id', cr.trip_id,
    'parcel_id', cr.parcel_id,
    'trip_status', v_trip_status,
    'parcel_status', v_parcel_status,
    'reserved_kg', v_reserved_kg,
    'capacity_action', v_capacity_action
  );
end;
$$;

revoke execute on function public.perform_carry_request_action(uuid, text) from public;
grant execute on function public.perform_carry_request_action(uuid, text) to authenticated;

-- Verification scenarios (manual):
-- 1. ACCEPT  -> carry_request PENDING_PAYMENT, parcel MATCHED, trip ACTIVE/FULL
-- 2. PAY     -> carry_request PENDING_HANDOVER, parcel MATCHED
-- 3. CONFIRM_HANDOVER (partial/full) / MARK_DELIVERED / IN_TRANSIT -> parcel MATCHED
-- 4. PAYMENT_EXPIRED -> parcel OPEN, capacity restored
-- 5. CANCEL / REJECT -> parcel OPEN
-- 6. RELEASE_PAYMENT -> parcel ARCHIVED only here; never on ACCEPT or PAY
