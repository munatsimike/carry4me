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
    'Share this 6-digit code with the recipient. They must provide it to the traveler when receiving the package: '
      || v_otp || '.',
    '/requests',
    jsonb_build_object(
      'carry_request_id', p_request_id
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