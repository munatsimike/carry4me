-- PAYMENT_RELEASED: notify sender + email traveler payout confirmation.

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
    'PAYMENT_RELEASED',
    'SENDER',
    'TRAVELER',
    'Payment released',
    'Payment has been released to the traveler. Thank you for using Carry4Me.',
    '/requests'
  ),
  (
    'PAYMENT_RELEASED',
    'TRAVELER',
    'TRAVELER',
    'Payout released',
    'Your payout has been released successfully. Depending on your bank, it may take 3 to 4 working days to arrive in your account.',
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
  v_actor_role text;
  v_recipient_role text;
  recipient_id uuid;
  counterparty_id uuid;
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
    if new.type = 'PAYMENT_COMPLETED' then
      counterparty_id := case
        when v_recipient_role = 'TRAVELER' then cr.sender_user_id
        else cr.traveler_user_id
      end;

      tpl_body := tpl_body || public.notification_contact_appendix(
        counterparty_id,
        case
          when v_recipient_role = 'TRAVELER' then 'Sender contact details:'
          else 'Traveler contact details:'
        end
      );
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
  end if;

  -- Paying sender also receives payment-completed notification + email.
  if new.type = 'PAYMENT_COMPLETED' and v_actor_role = 'SENDER' then
    select t.title, t.body, t.link
    into tpl_title, tpl_body, tpl_link
    from public.carry_request_notification_templates t
    where t.type = 'PAYMENT_COMPLETED'
      and t.recipient_role = 'SENDER'
      and t.actor_role = 'SENDER'
    limit 1;

    if tpl_title is not null then
      tpl_body := tpl_body || public.notification_contact_appendix(
        cr.traveler_user_id,
        'Traveler contact details:'
      );

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

  -- Releasing traveler also receives payout confirmation notification + email.
  if new.type = 'PAYMENT_RELEASED' and v_actor_role = 'TRAVELER' then
    select t.title, t.body, t.link
    into tpl_title, tpl_body, tpl_link
    from public.carry_request_notification_templates t
    where t.type = 'PAYMENT_RELEASED'
      and t.recipient_role = 'TRAVELER'
      and t.actor_role = 'TRAVELER'
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
