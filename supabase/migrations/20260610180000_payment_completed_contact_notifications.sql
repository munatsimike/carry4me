-- PAYMENT_COMPLETED: include counterparty name + phone in in-app notification body,
-- queue sender receipt email, and keep notify trigger aligned with email enrichment.

create or replace function public.format_profile_phone_for_notification(
  p_phone text,
  p_country_code text
)
returns text
language plpgsql
immutable
as $$
declare
  v_trimmed text;
  v_digits text;
  v_dial text;
begin
  v_trimmed := nullif(trim(coalesce(p_phone, '')), '');
  if v_trimmed is null then
    return null;
  end if;

  if v_trimmed like '+%' then
    return v_trimmed;
  end if;

  v_digits := regexp_replace(v_trimmed, '\D', '', 'g');
  if v_digits = '' then
    return v_trimmed;
  end if;

  v_dial := case trim(coalesce(p_country_code, ''))
    when 'UK' then '+44'
    when 'GB' then '+44'
    when 'United Kingdom' then '+44'
    when 'USA' then '+1'
    when 'US' then '+1'
    when 'United States' then '+1'
    when 'United States of America' then '+1'
    when 'Zimbabwe' then '+263'
    when 'ZW' then '+263'
    when 'NL' then '+31'
    when 'Netherlands' then '+31'
    else null
  end;

  if v_dial is null then
    return v_trimmed;
  end if;

  if v_digits like regexp_replace(v_dial, '\D', '', 'g') || '%' then
    return '+' || v_digits;
  end if;

  return v_dial || regexp_replace(v_digits, '^0+', '');
end;
$$;

create or replace function public.notification_contact_appendix(
  p_counterparty_user_id uuid,
  p_heading text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_phone text;
  v_lines text[] := array[]::text[];
begin
  select full_name, phone_number, country_code
  into v_profile
  from public.profiles
  where id = p_counterparty_user_id;

  v_lines := array_append(v_lines, '');
  v_lines := array_append(v_lines, p_heading);

  if nullif(trim(coalesce(v_profile.full_name, '')), '') is not null then
    v_lines := array_append(v_lines, trim(v_profile.full_name));
  end if;

  v_phone := public.format_profile_phone_for_notification(
    v_profile.phone_number,
    v_profile.country_code
  );

  if v_phone is not null then
    v_lines := array_append(v_lines, 'Phone: ' || v_phone);
  else
    v_lines := array_append(
      v_lines,
      'Phone: not available yet. Open Carry4Me to view contact details.'
    );
  end if;

  return array_to_string(v_lines, E'\n');
end;
$$;

revoke all on function public.format_profile_phone_for_notification(text, text) from public;
revoke all on function public.notification_contact_appendix(uuid, text) from public;

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

  return new;
end;
$$;

revoke all on function public.notify_on_carry_request_event() from public;

-- Ensure sender template exists (idempotent).
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
    'Payment has been completed. Please arrange the package handover with the traveler and confirm the handover.',
    '/requests'
  )
on conflict (type, recipient_role, actor_role)
do update set
  title = excluded.title,
  body = excluded.body,
  link = excluded.link;

update public.carry_request_notification_templates
set
  title = 'Payment received',
  body = 'The sender has paid. Please arrange the package handover and confirm it once completed.',
  link = '/requests'
where type = 'PAYMENT_COMPLETED'
  and recipient_role = 'TRAVELER'
  and actor_role = 'SENDER';
