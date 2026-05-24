-- Event-driven notifications:
--   carry_request_events (insert) -> notifications (template) -> email_queue
--
-- perform_carry_request_action and carry_requests insert only write events;
-- notify_on_carry_request_event() handles notification + email queue.

insert into public.carry_request_notification_templates (
  type,
  recipient_role,
  actor_role,
  title,
  body,
  link
)
values
  (
    'REQUEST_SENT',
    'TRAVELER',
    'SENDER',
    'New carry request',
    'A sender requested to carry their parcel on your trip.',
    '/requests'
  ),
  (
    'REQUEST_SENT',
    'SENDER',
    'TRAVELER',
    'New carry request',
    'A traveler offered to carry your parcel on their trip.',
    '/requests'
  )
on conflict (type, recipient_role, actor_role)
do update set
  title = excluded.title,
  body = excluded.body,
  link = excluded.link;

create or replace function public.notify_on_carry_request_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cr record;
  actor_role text;
  recipient_role text;
  recipient_id uuid;
  tpl record;
  notification_id uuid;
begin
  -- expire_overdue_carry_requests inserts events + notifications directly
  if new.type = 'REQUEST_EXPIRED' then
    return new;
  end if;

  if new.actor_user_id is null then
    return new;
  end if;

  select * into cr
  from public.carry_requests
  where id = new.carry_request_id;

  if not found then
    return new;
  end if;

  if new.actor_user_id = cr.sender_user_id then
    actor_role := 'SENDER';
    recipient_id := cr.traveler_user_id;
    recipient_role := 'TRAVELER';
  elsif new.actor_user_id = cr.traveler_user_id then
    actor_role := 'TRAVELER';
    recipient_id := cr.sender_user_id;
    recipient_role := 'SENDER';
  else
    return new;
  end if;

  select * into tpl
  from public.get_carry_request_notification_template(
    new.type,
    recipient_role,
    actor_role
  );

  if tpl.title is not null then
    insert into public.notifications (user_id, type, title, body, link, metadata)
    values (
      recipient_id,
      new.type,
      tpl.title,
      tpl.body,
      coalesce(tpl.link, '/requests'),
      jsonb_build_object(
        'carry_request_id', new.carry_request_id,
        'event_id', new.id
      )
    )
    returning id into notification_id;
  else
    insert into public.notifications (user_id, type, title, body, link, metadata)
    values (
      recipient_id,
      new.type,
      'Request update',
      'Your request was updated.',
      '/requests',
      jsonb_build_object(
        'carry_request_id', new.carry_request_id,
        'event_id', new.id
      )
    )
    returning id into notification_id;
  end if;

  insert into public.email_queue (notification_id, user_id)
  values (notification_id, recipient_id);

  return new;
end;
$$;

create or replace function public.emit_request_sent_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid;
begin
  actor_user_id := case
    when new.initiator_role = 'SENDER' then new.sender_user_id
    else new.traveler_user_id
  end;

  insert into public.carry_request_events (
    carry_request_id,
    type,
    actor_user_id,
    metadata
  )
  values (new.id, 'REQUEST_SENT', actor_user_id, '{}'::jsonb);

  return new;
end;
$$;

drop trigger if exists carry_requests_after_insert_emit_request_sent on public.carry_requests;
create trigger carry_requests_after_insert_emit_request_sent
after insert on public.carry_requests
for each row
execute function public.emit_request_sent_event();

drop trigger if exists carry_request_events_after_insert_notify on public.carry_request_events;
create trigger carry_request_events_after_insert_notify
after insert on public.carry_request_events
for each row
execute function public.notify_on_carry_request_event();

-- perform_carry_request_action: status transition + event only (no direct notification/email).
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
      payment_expires_at = new_payment_expires_at,
      expired_at = new_expired_at,
      updated_at = now()
  where id = request_id;

  insert into public.carry_request_events (carry_request_id, type, actor_user_id, metadata)
  values (request_id, event_type, uid, '{}'::jsonb);

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

drop trigger if exists carry_requests_after_insert_notify on public.carry_requests;
drop function if exists public.handle_carry_request_insert_notifications();
drop function if exists public.create_carry_request_notification(uuid, text, text, text, uuid);

revoke all on function public.notify_on_carry_request_event() from public;
revoke all on function public.emit_request_sent_event() from public;

revoke execute on function public.perform_carry_request_action(uuid, text) from public;
grant execute on function public.perform_carry_request_action(uuid, text) to authenticated;
