-- Fix 42702: recipient_role / actor_role clash with template table columns in WHERE clause.

create or replace function public.notify_on_carry_request_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cr record;
  v_actor_role text;
  v_recipient_role text;
  recipient_id uuid;
  tpl_title text;
  tpl_body text;
  tpl_link text;
  notification_id uuid;
begin
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
    v_actor_role := 'SENDER';
    recipient_id := cr.traveler_user_id;
    v_recipient_role := 'TRAVELER';
  elsif new.actor_user_id = cr.traveler_user_id then
    v_actor_role := 'TRAVELER';
    recipient_id := cr.sender_user_id;
    v_recipient_role := 'SENDER';
  else
    return new;
  end if;

  select t.title, t.body, t.link
  into tpl_title, tpl_body, tpl_link
  from public.carry_request_notification_templates t
  where t.type = new.type::text
    and t.recipient_role = v_recipient_role
    and t.actor_role = v_actor_role
  limit 1;

  if tpl_title is null then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, body, link, metadata)
  values (
    recipient_id,
    new.type::text,
    tpl_title,
    tpl_body,
    coalesce(tpl_link, '/requests'),
    jsonb_build_object(
      'carry_request_id', new.carry_request_id,
      'event_id', new.id
    )
  )
  returning id into notification_id;

  insert into public.email_queue (notification_id, user_id)
  values (notification_id, recipient_id);

  return new;
end;
$$;
