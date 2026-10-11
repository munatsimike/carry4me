-- Delivery OTP is emailed to the sender only.
-- Do not store digits in notifications.metadata (PostgREST + Realtime readable).
-- Short-lived plaintext lives in delivery_otp_email_secrets (service_role only)
-- until the email worker sends, then the row is deleted.
-- Hashing stays on carry_requests.delivery_otp_hash via hash_delivery_otp
-- (HMAC pepper can replace that function later without changing this flow).

begin;

create table if not exists public.delivery_otp_email_secrets (
  notification_id uuid primary key
    references public.notifications (id) on delete cascade,
  otp text not null,
  created_at timestamptz not null default now(),
  constraint delivery_otp_email_secrets_otp_digits check (otp ~ '^\d{6}$')
);

comment on table public.delivery_otp_email_secrets is
  'Short-lived plaintext delivery OTP for the email worker. Never grant to anon/authenticated. Delete after send or supersede.';

alter table public.delivery_otp_email_secrets enable row level security;

revoke all on table public.delivery_otp_email_secrets from public;
revoke all on table public.delivery_otp_email_secrets from anon;
revoke all on table public.delivery_otp_email_secrets from authenticated;
grant select, insert, update, delete on table public.delivery_otp_email_secrets to service_role;

create or replace function public.sender_payment_code_notification_body(
  p_preference text
)
returns text
language sql
immutable
as $$
  select case coalesce(nullif(lower(trim(p_preference)), ''), 'flexible')
    when 'handover' then
      'A delivery code was sent to your email. Give it to the traveler after parcel handover to release payment.'
    when 'delivery' then
      'A delivery code was sent to your email. Give it to the traveler after successful delivery to release payment.'
    else
      'A delivery code was sent to your email. Give it to the traveler after parcel handover or after successful delivery to release payment.'
  end;
$$;

create or replace function public.issue_delivery_otp(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cr record;
  v_otp text;
  v_hash text;
  v_expires timestamptz := '2099-12-31T23:59:59.999Z'::timestamptz;
  v_preference text := 'flexible';
  notification_id uuid;
begin
  select * into cr
  from public.carry_requests
  where id = p_request_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;

  if cr.status not in ('IN_TRANSIT', 'PENDING_PAYOUT') then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
  end if;

  if cr.delivery_otp_last_sent_at is not null
     and cr.delivery_otp_last_sent_at > now() - interval '60 seconds' then
    return jsonb_build_object('ok', false, 'reason', 'RATE_LIMITED');
  end if;

  select coalesce(p.payment_preference, 'flexible')
  into v_preference
  from public.parcels p
  where p.id = cr.parcel_id;

  v_preference := coalesce(v_preference, 'flexible');

  v_otp := public.generate_secure_otp_6();
  v_hash := public.hash_delivery_otp(p_request_id, v_otp);

  update public.carry_requests
  set
    delivery_otp_hash = v_hash,
    delivery_otp_expires_at = v_expires,
    delivery_otp_attempts = 0,
    delivery_otp_verified_at = null,
    delivery_otp_last_sent_at = now(),
    updated_at = now()
  where id = p_request_id;

  -- Drop stale plaintext so an older queued email cannot send a superseded code.
  delete from public.delivery_otp_email_secrets s
  using public.notifications n
  where s.notification_id = n.id
    and n.type = 'DELIVERY_OTP'
    and n.metadata ->> 'carry_request_id' = p_request_id::text;

  update public.email_queue q
  set
    status = 'failed',
    last_error = 'otp_superseded'
  from public.notifications n
  where q.notification_id = n.id
    and n.type = 'DELIVERY_OTP'
    and n.metadata ->> 'carry_request_id' = p_request_id::text
    and q.status in ('pending', 'failed');

  insert into public.notifications (user_id, type, title, body, link, metadata)
  values (
    cr.sender_user_id,
    'DELIVERY_OTP',
    'Payment release code',
    public.sender_payment_code_notification_body(v_preference),
    '/requests',
    jsonb_build_object(
      'carry_request_id', p_request_id,
      'payment_preference', v_preference
    )
  )
  returning id into notification_id;

  insert into public.email_queue (notification_id, user_id)
  values (notification_id, cr.sender_user_id);

  insert into public.delivery_otp_email_secrets (notification_id, otp)
  values (notification_id, v_otp);

  -- Do not return digits. service_role email worker reads delivery_otp_email_secrets.
  return jsonb_build_object(
    'ok', true,
    'notification_id', notification_id
  );
end;
$$;

revoke all on function public.sender_payment_code_notification_body(text)
  from public, anon, authenticated;
grant execute on function public.sender_payment_code_notification_body(text) to service_role;

revoke all on function public.issue_delivery_otp(uuid) from public, anon, authenticated;
grant execute on function public.issue_delivery_otp(uuid) to service_role;

-- Preserve in-flight emails: copy digits into the secrets table, then strip metadata.
insert into public.delivery_otp_email_secrets (notification_id, otp)
select n.id, trim(n.metadata ->> 'otp')
from public.notifications n
join public.email_queue q on q.notification_id = n.id
where n.metadata ? 'otp'
  and trim(n.metadata ->> 'otp') ~ '^\d{6}$'
  and q.status in ('pending', 'failed')
on conflict (notification_id) do nothing;

update public.notifications
set body = public.sender_payment_code_notification_body(
  coalesce(metadata ->> 'payment_preference', 'flexible')
)
where type = 'DELIVERY_OTP'
  and body ~ '\d{6}';

update public.notifications
set metadata = metadata - 'otp'
where metadata ? 'otp';

commit;
