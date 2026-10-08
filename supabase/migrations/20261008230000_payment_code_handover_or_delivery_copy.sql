-- Sender payment-code notification: say whether to give the code after
-- handover or after delivery, from the parcel's payment preference.

create or replace function public.sender_payment_code_notification_body(
  p_preference text
)
returns text
language sql
immutable
as $$
  select case coalesce(nullif(lower(trim(p_preference)), ''), 'flexible')
    when 'handover' then
      'Check your email for the payment code. Give it to the traveler after parcel handover to release payment.'
    when 'delivery' then
      'Check your email for the payment code. Give it to the traveler after successful delivery to release payment.'
    else
      'Check your email for the payment code. Give it to the traveler after parcel handover or after successful delivery to release payment.'
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

  insert into public.notifications (user_id, type, title, body, link, metadata)
  values (
    cr.sender_user_id,
    'DELIVERY_OTP',
    'Payment release code',
    public.sender_payment_code_notification_body(v_preference),
    '/requests',
    jsonb_build_object(
      'carry_request_id', p_request_id,
      'otp', v_otp,
      'payment_preference', v_preference
    )
  )
  returning id into notification_id;

  insert into public.email_queue (notification_id, user_id)
  values (notification_id, cr.sender_user_id);

  return jsonb_build_object(
    'ok', true,
    'otp', v_otp
  );
end;
$$;

revoke all on function public.sender_payment_code_notification_body(text) from public;
