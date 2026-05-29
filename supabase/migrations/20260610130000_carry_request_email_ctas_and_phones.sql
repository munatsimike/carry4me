-- Carry-request email CTAs: sender payment receipt, handover contact details copy,
-- and notify the paying sender to confirm handover after payment.

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
    'PAYMENT_COMPLETED',
    'SENDER',
    'SENDER',
    'Payment completed',
    'Your payment was successful. Please confirm handover when you meet the traveler.',
    '/requests'
  )
on conflict (type, recipient_role, actor_role)
do update set
  title = excluded.title,
  body = excluded.body,
  link = excluded.link;

update public.carry_request_notification_templates
set body = 'Payment was completed. Please confirm handover when you are ready.'
where type = 'PAYMENT_COMPLETED'
  and recipient_role = 'TRAVELER'
  and actor_role = 'SENDER';

update public.carry_request_notification_templates
set body = 'Both parties confirmed handover. The parcel is now in transit. Contact details are below.'
where type = 'PARCEL_RECEIVED';

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

  if tpl_title is not null then
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
  end if;

  if new.type = 'PAYMENT_COMPLETED' and v_actor_role = 'SENDER' then
    select t.title, t.body, t.link
    into tpl_title, tpl_body, tpl_link
    from public.carry_request_notification_templates t
    where t.type = 'PAYMENT_COMPLETED'
      and t.recipient_role = 'SENDER'
      and t.actor_role = 'SENDER'
    limit 1;

    if tpl_title is not null then
      insert into public.notifications (user_id, type, title, body, link, metadata)
      values (
        new.actor_user_id,
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
      values (notification_id, new.actor_user_id);
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.notify_on_carry_request_event() from public;
