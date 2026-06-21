-- Fix expire_overdue_carry_requests (42601: query has no destination for result data).
-- Replace the CTE batch with an explicit loop + PERFORM so side effects always run safely.

create or replace function public.expire_overdue_carry_requests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer := 0;
  r record;
  v_notification_id uuid;
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

    expired_count := expired_count + 1;
  end loop;

  return expired_count;
end;
$$;

revoke all on function public.expire_overdue_carry_requests() from public;
grant execute on function public.expire_overdue_carry_requests() to authenticated;
