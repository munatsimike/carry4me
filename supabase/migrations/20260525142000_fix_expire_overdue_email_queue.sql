-- Fix expire_overdue_carry_requests: only queue email when a notification row exists.
-- The loop-based version could insert email_queue with a null notification_id (23502).
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
  parcels_synced as (
    select
      e.id,
      public.sync_parcel_status_after_request_action(e.id, 'EXPIRED', 'EXPIRED') as parcel_status
    from expired_rows e
  ),
  trips_recalculated as (
    select distinct on (e.trip_id)
      e.trip_id,
      public.recalculate_trip_status(e.trip_id) as trip_status
    from expired_rows e
    order by e.trip_id, e.id
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
