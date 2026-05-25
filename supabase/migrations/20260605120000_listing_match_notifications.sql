-- Step 2: listing_match_events -> notifications -> email_queue (carry-request pattern).
-- Also emit match events when trip/parcel edits change route, weight, or status.

create table if not exists public.listing_match_notification_templates (
  type text not null,
  recipient_role text not null check (recipient_role in ('SENDER', 'TRAVELER')),
  actor_role text not null check (actor_role in ('SENDER', 'TRAVELER')),
  title text not null,
  body text not null,
  link text not null,
  primary key (type, recipient_role, actor_role)
);

insert into public.listing_match_notification_templates (
  type,
  recipient_role,
  actor_role,
  title,
  body,
  link
)
values
  (
    'MATCHING_TRIP_POSTED',
    'SENDER',
    'TRAVELER',
    'New matching trip',
    'A traveler posted a trip that matches your parcel route. View it on the marketplace.',
    '/travelers'
  ),
  (
    'MATCHING_PARCEL_POSTED',
    'TRAVELER',
    'SENDER',
    'New matching parcel',
    'A sender posted a parcel that matches your trip route. View it on the marketplace.',
    '/parcels'
  )
on conflict (type, recipient_role, actor_role)
do update set
  title = excluded.title,
  body = excluded.body,
  link = excluded.link;

create or replace function public.notify_on_listing_match_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient_role text;
  v_actor_role text;
  tpl_title text;
  tpl_body text;
  tpl_link text;
  notification_id uuid;
begin
  if new.type = 'MATCHING_TRIP_POSTED' then
    v_recipient_role := 'SENDER';
    v_actor_role := 'TRAVELER';
  elsif new.type = 'MATCHING_PARCEL_POSTED' then
    v_recipient_role := 'TRAVELER';
    v_actor_role := 'SENDER';
  else
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

drop trigger if exists listing_match_events_after_insert_notify on public.listing_match_events;
create trigger listing_match_events_after_insert_notify
  after insert on public.listing_match_events
  for each row
  execute function public.notify_on_listing_match_event();

create or replace function public.emit_listing_match_events_on_trip_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from 'ACTIVE'::public.trip_status then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.origin_country is not distinct from old.origin_country
       and new.destination_country is not distinct from old.destination_country
       and new.capacity_kg is not distinct from old.capacity_kg
       and new.reserved_weight_kg is not distinct from old.reserved_weight_kg
       and new.used_weight_kg is not distinct from old.used_weight_kg
       and new.status is not distinct from old.status
    then
      return new;
    end if;
  end if;

  perform public.emit_listing_match_events_for_trip(new.id);
  return new;
end;
$$;

create or replace function public.emit_listing_match_events_on_parcel_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from 'OPEN'::public.parcel_status then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.origin_country is not distinct from old.origin_country
       and new.destination_country is not distinct from old.destination_country
       and new.weight_kg is not distinct from old.weight_kg
       and new.status is not distinct from old.status
    then
      return new;
    end if;
  end if;

  perform public.emit_listing_match_events_for_parcel(new.id);
  return new;
end;
$$;

drop trigger if exists trips_after_update_match_events on public.trips;
create trigger trips_after_update_match_events
  after update on public.trips
  for each row
  execute function public.emit_listing_match_events_on_trip_update();

drop trigger if exists parcels_after_update_match_events on public.parcels;
create trigger parcels_after_update_match_events
  after update on public.parcels
  for each row
  execute function public.emit_listing_match_events_on_parcel_update();

revoke all on function public.notify_on_listing_match_event() from public;
