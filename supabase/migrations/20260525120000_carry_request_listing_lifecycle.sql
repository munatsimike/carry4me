-- Carry request / trip / parcel lifecycle in PostgreSQL (RPC-driven).
-- Trip "no capacity" status uses enum FULL (not MATCHED). Parcel waiting-for-payment uses MATCHED.

-- ---------------------------------------------------------------------------
-- A. Capacity tracking on carry_requests (idempotent reserve / restore / consume)
-- ---------------------------------------------------------------------------
alter table public.carry_requests
  add column if not exists reserved_kg numeric not null default 0,
  add column if not exists capacity_reserved_at timestamptz,
  add column if not exists capacity_released_at timestamptz,
  add column if not exists capacity_consumed_at timestamptz;

comment on column public.carry_requests.reserved_kg is
  'Kg reserved on the matched trip for this request (set on ACCEPT).';
comment on column public.carry_requests.capacity_reserved_at is
  'When trip reserved_weight_kg was increased for this request.';
comment on column public.carry_requests.capacity_released_at is
  'When reserved kg was returned to the trip pool (cancel / payment expiry).';
comment on column public.carry_requests.capacity_consumed_at is
  'When reserved kg moved to used_weight_kg (PAID_OUT / completed delivery).';

-- ---------------------------------------------------------------------------
-- B. Helpers
-- ---------------------------------------------------------------------------

create or replace function public.carry_request_weight_kg(p_request_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif((cr.parcel_snapshot ->> 'weight_kg')::numeric, 0),
    p.weight_kg,
    0
  )
  from public.carry_requests cr
  join public.parcels p on p.id = cr.parcel_id
  where cr.id = p_request_id;
$$;

revoke all on function public.carry_request_weight_kg(uuid) from public;

create or replace function public.trip_available_kg(p_trip_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    0,
    t.capacity_kg - t.reserved_weight_kg - t.used_weight_kg
  )
  from public.trips t
  where t.id = p_trip_id;
$$;

revoke all on function public.trip_available_kg(uuid) from public;

-- Archives past-departure trips first; never reactivates past trips.
create or replace function public.recalculate_trip_status(p_trip_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  t record;
  v_available numeric;
begin
  select *
  into t
  from public.trips
  where id = p_trip_id
  for update;

  if not found then
    return null;
  end if;

  if t.depart_date < current_date then
    update public.trips
    set status = 'ARCHIVED'::public.trip_status,
        updated_at = now()
    where id = p_trip_id;

    return 'ARCHIVED';
  end if;

  if t.status = 'ARCHIVED'::public.trip_status then
    return 'ARCHIVED';
  end if;

  v_available := greatest(
    0,
    t.capacity_kg - t.reserved_weight_kg - t.used_weight_kg
  );

  if v_available <= 0 then
    update public.trips
    set status = 'FULL'::public.trip_status,
        updated_at = now()
    where id = p_trip_id;

    return 'FULL';
  end if;

  update public.trips
  set status = 'ACTIVE'::public.trip_status,
      updated_at = now()
  where id = p_trip_id;

  return 'ACTIVE';
end;
$$;

revoke all on function public.recalculate_trip_status(uuid) from public;

create or replace function public.reserve_trip_capacity_for_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cr record;
  v_weight numeric;
  v_trip_status text;
begin
  select *
  into cr
  from public.carry_requests
  where id = p_request_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;

  if cr.capacity_reserved_at is not null then
    v_trip_status := public.recalculate_trip_status(cr.trip_id);
    return jsonb_build_object(
      'ok', true,
      'capacity_action', 'none',
      'reserved_kg', cr.reserved_kg,
      'trip_status', v_trip_status
    );
  end if;

  v_weight := public.carry_request_weight_kg(p_request_id);

  if v_weight <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_REQUEST_WEIGHT');
  end if;

  if not public.trip_has_available_capacity(cr.trip_id, v_weight) then
    return jsonb_build_object('ok', false, 'reason', 'INSUFFICIENT_CAPACITY');
  end if;

  update public.trips
  set reserved_weight_kg = reserved_weight_kg + v_weight,
      updated_at = now()
  where id = cr.trip_id;

  update public.carry_requests
  set reserved_kg = v_weight,
      capacity_reserved_at = now(),
      updated_at = now()
  where id = p_request_id;

  v_trip_status := public.recalculate_trip_status(cr.trip_id);

  return jsonb_build_object(
    'ok', true,
    'capacity_action', 'reserved',
    'reserved_kg', v_weight,
    'trip_status', v_trip_status
  );
end;
$$;

revoke all on function public.reserve_trip_capacity_for_request(uuid) from public;

create or replace function public.restore_trip_capacity_for_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cr record;
  v_trip_status text;
begin
  select *
  into cr
  from public.carry_requests
  where id = p_request_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;

  if cr.capacity_reserved_at is null
     or cr.capacity_released_at is not null
     or cr.capacity_consumed_at is not null
     or cr.reserved_kg <= 0 then
    v_trip_status := public.recalculate_trip_status(cr.trip_id);
    return jsonb_build_object(
      'ok', true,
      'capacity_action', 'none',
      'reserved_kg', cr.reserved_kg,
      'trip_status', v_trip_status
    );
  end if;

  update public.trips
  set reserved_weight_kg = greatest(0, reserved_weight_kg - cr.reserved_kg),
      updated_at = now()
  where id = cr.trip_id;

  update public.carry_requests
  set capacity_released_at = now(),
      updated_at = now()
  where id = p_request_id;

  v_trip_status := public.recalculate_trip_status(cr.trip_id);

  return jsonb_build_object(
    'ok', true,
    'capacity_action', 'restored',
    'reserved_kg', cr.reserved_kg,
    'trip_status', v_trip_status
  );
end;
$$;

revoke all on function public.restore_trip_capacity_for_request(uuid) from public;

create or replace function public.consume_trip_capacity_for_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cr record;
  v_trip_status text;
begin
  select *
  into cr
  from public.carry_requests
  where id = p_request_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;

  if cr.capacity_reserved_at is null
     or cr.capacity_consumed_at is not null
     or cr.capacity_released_at is not null
     or cr.reserved_kg <= 0 then
    v_trip_status := public.recalculate_trip_status(cr.trip_id);
    return jsonb_build_object(
      'ok', true,
      'capacity_action', 'none',
      'reserved_kg', cr.reserved_kg,
      'trip_status', v_trip_status
    );
  end if;

  update public.trips
  set reserved_weight_kg = greatest(0, reserved_weight_kg - cr.reserved_kg),
      used_weight_kg = used_weight_kg + cr.reserved_kg,
      updated_at = now()
  where id = cr.trip_id;

  update public.carry_requests
  set capacity_consumed_at = now(),
      updated_at = now()
  where id = p_request_id;

  v_trip_status := public.recalculate_trip_status(cr.trip_id);

  return jsonb_build_object(
    'ok', true,
    'capacity_action', 'consumed',
    'reserved_kg', cr.reserved_kg,
    'trip_status', v_trip_status
  );
end;
$$;

revoke all on function public.consume_trip_capacity_for_request(uuid) from public;

create or replace function public.update_parcel_status_for_request(
  p_request_id uuid,
  p_new_status text
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

revoke all on function public.update_parcel_status_for_request(uuid, text) from public;

create or replace function public.archive_past_trips()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.trips
  set status = 'ARCHIVED'::public.trip_status,
      updated_at = now()
  where depart_date < current_date
    and status <> 'ARCHIVED'::public.trip_status;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.archive_past_trips() from public;
grant execute on function public.archive_past_trips() to authenticated;

-- ---------------------------------------------------------------------------
-- C. Payment expiry (uses helpers; idempotent restore)
-- ---------------------------------------------------------------------------
create or replace function public.expire_overdue_carry_requests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer := 0;
begin
  perform public.archive_past_trips();

  with expired_rows as (
    update public.carry_requests cr
    set status = 'EXPIRED',
        expired_at = now(),
        payment_expires_at = null,
        updated_at = now()
    where cr.status = 'PENDING_PAYMENT'
      and cr.payment_expires_at is not null
      and cr.payment_expires_at <= now()
    returning cr.id, cr.trip_id, cr.sender_user_id, cr.traveler_user_id
  ),
  restored as (
    select
      e.id,
      public.restore_trip_capacity_for_request(e.id) as restore_result
    from expired_rows e
  ),
  parcels_open as (
    select
      e.id,
      public.update_parcel_status_for_request(e.id, 'OPEN') as parcel_status
    from expired_rows e
  ),
  inserted_events as (
    insert into public.carry_request_events (
      carry_request_id,
      type,
      actor_user_id,
      metadata
    )
    select e.id, 'REQUEST_EXPIRED', null, '{}'::jsonb
    from expired_rows e
    returning 1
  ),
  sender_notifications as (
    insert into public.notifications (user_id, type, title, body, link, metadata)
    select
      e.sender_user_id,
      'REQUEST_EXPIRED',
      tpl.title,
      tpl.body,
      tpl.link,
      jsonb_build_object('carry_request_id', e.id)
    from expired_rows e
    join lateral public.get_carry_request_notification_template(
      'REQUEST_EXPIRED',
      'SENDER',
      'TRAVELER'
    ) tpl on true
    returning id, user_id
  ),
  traveler_notifications as (
    insert into public.notifications (user_id, type, title, body, link, metadata)
    select
      e.traveler_user_id,
      'REQUEST_EXPIRED',
      tpl.title,
      tpl.body,
      tpl.link,
      jsonb_build_object('carry_request_id', e.id)
    from expired_rows e
    join lateral public.get_carry_request_notification_template(
      'REQUEST_EXPIRED',
      'TRAVELER',
      'SENDER'
    ) tpl on true
    returning id, user_id
  ),
  email_queue_rows as (
    insert into public.email_queue (notification_id, user_id)
    select n.id, n.user_id from sender_notifications n
    union all
    select n.id, n.user_id from traveler_notifications n
  )
  select count(*)::integer into expired_count from expired_rows;

  return expired_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- D. perform_carry_request_action (lifecycle integrated)
-- ---------------------------------------------------------------------------
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

      v_parcel_status := public.update_parcel_status_for_request(request_id, 'MATCHED');
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

  -- Listing / capacity side effects
  if action_key = 'ACCEPT' then
    v_parcel_status := public.update_parcel_status_for_request(request_id, 'MATCHED');
    v_trip_status := coalesce(v_capacity ->> 'trip_status', public.recalculate_trip_status(cr.trip_id));
    v_reserved_kg := coalesce((v_capacity ->> 'reserved_kg')::numeric, cr.reserved_kg);

  elsif action_key in ('REJECT') then
    v_parcel_status := public.update_parcel_status_for_request(request_id, 'OPEN');
    v_trip_status := public.recalculate_trip_status(cr.trip_id);
    v_reserved_kg := cr.reserved_kg;

  elsif action_key = 'CANCEL' then
    v_capacity := public.restore_trip_capacity_for_request(request_id);
    v_capacity_action := coalesce(v_capacity ->> 'capacity_action', 'none');
    v_parcel_status := public.update_parcel_status_for_request(request_id, 'OPEN');
    v_trip_status := coalesce(v_capacity ->> 'trip_status', public.recalculate_trip_status(cr.trip_id));
    v_reserved_kg := cr.reserved_kg;

  elsif action_key in ('PAY', 'CONFIRM_HANDOVER', 'MARK_DELIVERED') then
    v_parcel_status := public.update_parcel_status_for_request(request_id, 'MATCHED');
    v_trip_status := public.recalculate_trip_status(cr.trip_id);
    v_reserved_kg := cr.reserved_kg;
    v_capacity_action := 'none';

  elsif action_key = 'RELEASE_PAYMENT' then
    v_capacity := public.consume_trip_capacity_for_request(request_id);
    v_capacity_action := coalesce(v_capacity ->> 'capacity_action', 'none');
    v_parcel_status := public.update_parcel_status_for_request(request_id, 'ARCHIVED');
    v_trip_status := coalesce(v_capacity ->> 'trip_status', public.recalculate_trip_status(cr.trip_id));
    v_reserved_kg := cr.reserved_kg;

  else
    v_reserved_kg := cr.reserved_kg;
  end if;

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

-- ---------------------------------------------------------------------------
-- E. Optional hourly cron for archive_past_trips (pg_cron on Supabase)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'archive-past-trips-hourly';

    perform cron.schedule(
      'archive-past-trips-hourly',
      '0 * * * *',
      $cron$select public.archive_past_trips();$cron$
    );
  end if;
exception
  when others then
    raise notice 'archive-past-trips-hourly cron not scheduled: %', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- F. Verification queries (manual)
-- ---------------------------------------------------------------------------
-- 1) ACCEPT, remaining kg > 0:
--    perform_carry_request_action(..., 'ACCEPT') -> new_status PENDING_PAYMENT, parcel MATCHED, trip ACTIVE
-- 2) ACCEPT, remaining kg = 0 after reserve:
--    -> trip FULL (equivalent to "matched/full" in UI)
-- 3) expire_overdue_carry_requests after expiry:
--    -> kg restored once, parcel OPEN, trip ACTIVE if depart_date >= current_date
-- 4) expiry on past trip:
--    -> parcel OPEN, trip ARCHIVED (depart_date < current_date)
-- 5) CANCEL after ACCEPT twice:
--    -> capacity_action restored once, then none; parcel OPEN
-- 6) RELEASE_PAYMENT:
--    -> parcel ARCHIVED, capacity consumed, trip ARCHIVED if past else FULL/ACTIVE
