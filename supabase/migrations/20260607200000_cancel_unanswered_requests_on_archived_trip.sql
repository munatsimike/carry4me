-- Auto-cancel unanswered requests when trip date has passed and trip is archived.
-- Scope intentionally limited to requests still awaiting traveler response.

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
    returning 1
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
  ),
  email_queue_rows as (
    insert into public.email_queue (notification_id, user_id)
    select n.id, n.user_id from sender_notifications n
    union all
    select n.id, n.user_id from traveler_notifications n
  )
  select 1;

  return v_count;
end;
$$;

revoke all on function public.archive_past_trips() from public;
grant execute on function public.archive_past_trips() to authenticated;
