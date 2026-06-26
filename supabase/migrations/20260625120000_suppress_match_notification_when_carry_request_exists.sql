-- Skip "new matching trip/parcel" alerts once a carry request already exists for that pair.
-- Prevents a delayed match notification from appearing above REQUEST_ACCEPTED.

create or replace function public.notify_on_listing_match_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient_role text;
  v_actor_role text;
  v_trip_id uuid;
  v_parcel_id uuid;
  tpl_title text;
  tpl_body text;
  tpl_link text;
  notification_id uuid;
begin
  if new.type = 'MATCHING_TRIP_POSTED' then
    v_recipient_role := 'SENDER';
    v_actor_role := 'TRAVELER';
    v_trip_id := new.matched_listing_id;
    v_parcel_id := new.source_listing_id;
  elsif new.type = 'MATCHING_PARCEL_POSTED' then
    v_recipient_role := 'TRAVELER';
    v_actor_role := 'SENDER';
    v_parcel_id := new.matched_listing_id;
    v_trip_id := new.source_listing_id;
  else
    return new;
  end if;

  if exists (
    select 1
    from public.carry_requests cr
    where cr.trip_id = v_trip_id
      and cr.parcel_id = v_parcel_id
  ) then
    return new;
  end if;

  select t.title, t.body, t.link
  into tpl_title, tpl_body, tpl_link
  from public.listing_match_notification_templates t
  where t.type = new.type
    and t.recipient_role = v_recipient_role
    and t.actor_role = v_actor_role
  limit 1;

  if tpl_title is null then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, body, link, metadata)
  values (
    new.recipient_user_id,
    new.type,
    tpl_title,
    tpl_body,
    coalesce(tpl_link, '/'),
    jsonb_build_object(
      'listing_match_event_id', new.id,
      'matched_listing_type', new.matched_listing_type,
      'matched_listing_id', new.matched_listing_id,
      'source_listing_type', new.source_listing_type,
      'source_listing_id', new.source_listing_id,
      'actor_user_id', new.actor_user_id
    )
  )
  returning id into notification_id;

  insert into public.email_queue (notification_id, user_id)
  values (notification_id, new.recipient_user_id);

  return new;
end;
$$;
