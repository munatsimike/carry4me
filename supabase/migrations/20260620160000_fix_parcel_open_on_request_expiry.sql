-- Ensure parcels return to OPEN when a carry request expires (payment window missed).
-- Adds a safety trigger, hardens expire_carry_request, and backfills stuck MATCHED parcels.

-- Fix archive_past_trips (42601: trailing `select 1` in plpgsql CTE chain).
create or replace function public.archive_past_trips()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.trips t
  set status = 'ARCHIVED'::public.trip_status,
      updated_at = now()
  where public.trip_departure_is_past(t.depart_date)
    and not public.trip_status_is_terminal(t.status);

  get diagnostics v_count = row_count;

  with canceled_requests as (
    update public.carry_requests cr
    set status = 'CANCELLED',
        expired_at = coalesce(cr.expired_at, now()),
        updated_at = now()
    from public.trips t
    where cr.trip_id = t.id
      and cr.status = 'PENDING_ACCEPTANCE'
      and t.status = 'ARCHIVED'
      and public.trip_departure_is_past(t.depart_date)
    returning cr.id, cr.sender_user_id, cr.traveler_user_id
  ),
  inserted_events as (
    insert into public.carry_request_events (
      carry_request_id,
      type,
      actor_user_id,
      metadata
    )
    select
      r.id,
      'REQUEST_CANCELED',
      null,
      jsonb_build_object('reason', 'TRIP_DATE_PASSED_NO_RESPONSE')
    from canceled_requests r
  ),
  sender_notifications as (
    insert into public.notifications (user_id, type, title, body, link, metadata)
    select
      r.sender_user_id,
      'REQUEST_CANCELED',
      'Request cancelled',
      'This request was cancelled because the trip date has passed and there was no response from the traveler.',
      '/requests',
      jsonb_build_object(
        'carry_request_id', r.id,
        'reason', 'TRIP_DATE_PASSED_NO_RESPONSE'
      )
    from canceled_requests r
    returning id, user_id
  ),
  traveler_notifications as (
    insert into public.notifications (user_id, type, title, body, link, metadata)
    select
      r.traveler_user_id,
      'REQUEST_CANCELED',
      'Request cancelled',
      'This request was cancelled because the trip date has passed and there was no response in time.',
      '/requests',
      jsonb_build_object(
        'carry_request_id', r.id,
        'reason', 'TRIP_DATE_PASSED_NO_RESPONSE'
      )
    from canceled_requests r
    returning id, user_id
  )
  insert into public.email_queue (notification_id, user_id)
  select n.id, n.user_id from sender_notifications n
  union all
  select n.id, n.user_id from traveler_notifications n;

  return v_count;
end;
$$;

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
  if p_action_key = 'RELEASE_PAYMENT' or p_new_request_status = 'PAID_OUT' then
    return public.update_parcel_status_for_request(p_request_id, 'ARCHIVED', true);
  end if;

  if p_action_key in ('REJECT', 'CANCEL', 'EXPIRED')
     or p_new_request_status in ('EXPIRED', 'REJECTED', 'CANCELLED') then
    return public.update_parcel_status_for_request(p_request_id, 'OPEN', false);
  end if;

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

create or replace function public.reopen_parcel_for_expired_request(p_request_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  v_status := public.sync_parcel_status_after_request_action(
    p_request_id,
    'EXPIRED',
    'EXPIRED'
  );

  if v_status is distinct from 'OPEN' then
    v_status := public.update_parcel_status_for_request(p_request_id, 'OPEN', false);
  end if;

  return v_status;
end;
$$;

create or replace function public.trg_reopen_parcel_on_carry_request_expired()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'EXPIRED' and old.status is distinct from 'EXPIRED' then
    perform public.reopen_parcel_for_expired_request(new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists carry_requests_reopen_parcel_on_expired on public.carry_requests;

create trigger carry_requests_reopen_parcel_on_expired
  after update of status on public.carry_requests
  for each row
  when (new.status = 'EXPIRED' and old.status is distinct from 'EXPIRED')
  execute function public.trg_reopen_parcel_on_carry_request_expired();

create or replace function public.expire_carry_request(p_request_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_notification_id uuid;
begin
  select cr.id, cr.trip_id, cr.sender_user_id, cr.traveler_user_id, cr.status, cr.payment_expires_at
  into r
  from public.carry_requests cr
  where cr.id = p_request_id
  for update of cr;

  if not found then
    return false;
  end if;

  if r.status = 'EXPIRED' then
    perform public.reopen_parcel_for_expired_request(r.id);
    return true;
  end if;

  if r.status <> 'PENDING_PAYMENT' then
    return false;
  end if;

  if r.payment_expires_at is null or r.payment_expires_at > now() then
    return false;
  end if;

  update public.carry_requests
  set status = 'EXPIRED',
      expired_at = now(),
      payment_expires_at = null,
      updated_at = now()
  where id = r.id;

  perform public.restore_trip_capacity_for_request(r.id);
  perform public.reopen_parcel_for_expired_request(r.id);
  perform public.recalculate_trip_status(r.trip_id);

  insert into public.carry_request_events (
    carry_request_id,
    type,
    actor_user_id,
    metadata
  )
  values (r.id, 'REQUEST_EXPIRED', null, '{}'::jsonb);

  v_notification_id := null;
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
  ) tpl
  returning id into v_notification_id;

  if v_notification_id is not null then
    insert into public.email_queue (notification_id, user_id)
    values (v_notification_id, r.sender_user_id);
  end if;

  v_notification_id := null;
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
  ) tpl
  returning id into v_notification_id;

  if v_notification_id is not null then
    insert into public.email_queue (notification_id, user_id)
    values (v_notification_id, r.traveler_user_id);
  end if;

  return true;
end;
$$;

-- Backfill parcels left MATCHED after their carry request expired.
update public.parcels p
set status = 'OPEN'::public.parcel_status,
    updated_at = now()
from public.carry_requests cr
where cr.parcel_id = p.id
  and cr.status = 'EXPIRED'
  and p.status = 'MATCHED'::public.parcel_status;

-- Expire any overdue payment windows that were missed and reopen their parcels.
do $$
begin
  perform public.expire_overdue_carry_requests();
end;
$$;

revoke all on function public.reopen_parcel_for_expired_request(uuid) from public;
grant execute on function public.reopen_parcel_for_expired_request(uuid) to authenticated;
grant execute on function public.reopen_parcel_for_expired_request(uuid) to service_role;

revoke all on function public.expire_carry_request(uuid) from public;
grant execute on function public.expire_carry_request(uuid) to authenticated;
grant execute on function public.expire_carry_request(uuid) to service_role;
