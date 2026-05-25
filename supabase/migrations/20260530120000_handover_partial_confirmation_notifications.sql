-- Notify the other party when one side confirms handover (before both confirm).
-- PARCEL_RECEIVED event + templates remain for when both parties have confirmed.

alter table public.carry_request_events
drop constraint if exists carry_request_events_type_check;

alter table public.carry_request_events
add constraint carry_request_events_type_check
check (
  type in (
    'REQUEST_SENT',
    'REQUEST_ACCEPTED',
    'REQUEST_REJECTED',
    'REQUEST_CANCELED',
    'REQUEST_EXPIRED',
    'PAYMENT_COMPLETED',
    'HANDOVER_CONFIRMED',
    'PARCEL_RECEIVED',
    'PARCEL_DELIVERED',
    'PAYMENT_RELEASED'
  )
);

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
    'HANDOVER_CONFIRMED',
    'TRAVELER',
    'SENDER',
    'Sender confirmed handover',
    'The sender has confirmed handover. Please confirm when you have received the parcel.',
    '/requests'
  ),
  (
    'HANDOVER_CONFIRMED',
    'SENDER',
    'TRAVELER',
    'Traveler confirmed handover',
    'The traveler has confirmed handover. Please confirm when you have handed over the parcel.',
    '/requests'
  )
on conflict (type, recipient_role, actor_role)
do update set
  title = excluded.title,
  body = excluded.body,
  link = excluded.link;

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
      payment_expires_at = coalesce(new_payment_expires_at, payment_expires_at),
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

revoke execute on function public.perform_carry_request_action(uuid, text) from public;
grant execute on function public.perform_carry_request_action(uuid, text) to authenticated;
