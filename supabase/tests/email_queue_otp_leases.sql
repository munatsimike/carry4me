-- Email queue leases, cooldown, cleanup. Always rolled back.
-- Run after migrations: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f this file

begin;

do $$
begin
  if has_function_privilege(
    'authenticated',
    'public.claim_email_queue_row(uuid, uuid, integer)',
    'EXECUTE'
  ) then
    raise exception 'authenticated can EXECUTE claim_email_queue_row';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.claim_due_email_queue(integer, integer)',
    'EXECUTE'
  ) then
    raise exception 'authenticated can EXECUTE claim_due_email_queue';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.cleanup_delivery_otp_email_secrets()',
    'EXECUTE'
  ) then
    raise exception 'authenticated can EXECUTE cleanup_delivery_otp_email_secrets';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.claim_email_queue_row(uuid, uuid, integer)',
    'EXECUTE'
  ) then
    raise exception 'service_role lost claim_email_queue_row';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.verify_delivery_otp(uuid, text)',
    'EXECUTE'
  ) then
    raise exception 'authenticated lost EXECUTE on verify_delivery_otp';
  end if;

  if public.sender_payment_code_notification_body('handover', 'queued')
     not like 'We''re sending a delivery code%' then
    raise exception 'queued copy missing';
  end if;

  if public.sender_payment_code_notification_body('handover', 'sent')
     not like 'A delivery code was sent%' then
    raise exception 'sent copy missing';
  end if;

  if public.sender_payment_code_notification_body('handover', 'failed')
     not like '%couldn''t email%' then
    raise exception 'failed copy missing';
  end if;

  if pg_get_functiondef('public.issue_delivery_otp(uuid)'::regprocedure)
     not ilike '%for update%' then
    raise exception 'issue_delivery_otp lost row lock';
  end if;

  if pg_get_functiondef('public.claim_due_email_queue(integer, integer)'::regprocedure)
     not ilike '%skip locked%' then
    raise exception 'claim_due_email_queue lost SKIP LOCKED';
  end if;
end;
$$;

do $$
declare
  v_uid uuid;
  v_nid uuid;
  v_qid uuid;
  v_lease uuid := gen_random_uuid();
  v_lease2 uuid := gen_random_uuid();
  v_claimed public.email_queue;
  v_claimed2 public.email_queue;
  v_ok boolean;
  v_deleted int;
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'otp-lease-' || gen_random_uuid()::text || '@carry4me.test',
    crypt('test', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    '',
    '',
    '',
    ''
  )
  returning id into v_uid;

  insert into public.profiles (id)
  values (v_uid)
  on conflict (id) do nothing;

  insert into public.notifications (user_id, type, title, body, link, metadata)
  values (
    v_uid,
    'DELIVERY_OTP',
    'Payment release code',
    public.sender_payment_code_notification_body('flexible', 'queued'),
    '/requests',
    jsonb_build_object('email_status', 'queued')
  )
  returning id into v_nid;

  insert into public.email_queue (notification_id, user_id, status, next_attempt_at)
  values (v_nid, v_uid, 'pending', now())
  returning id into v_qid;

  insert into public.delivery_otp_email_secrets (notification_id, otp)
  values (v_nid, '123456');

  v_claimed := public.claim_email_queue_row(v_qid, v_lease, 120);
  if v_claimed.id is null or v_claimed.status <> 'processing' then
    raise exception 'first claim failed';
  end if;

  v_claimed2 := public.claim_email_queue_row(v_qid, v_lease2, 120);
  if v_claimed2.id is not null then
    raise exception 'second live claim must not win';
  end if;

  if public.email_queue_lease_is_active(v_qid, v_lease) is not true then
    raise exception 'lease should be active';
  end if;

  if public.email_queue_lease_is_active(v_qid, v_lease2) is not false then
    raise exception 'foreign lease must not be active';
  end if;

  -- Crash: expire lease, reclaim, second worker wins.
  update public.email_queue
  set lease_expires_at = now() - interval '1 second'
  where id = v_qid;

  if public.reclaim_stale_email_queue_leases() < 1 then
    raise exception 'stale lease was not reclaimed';
  end if;

  v_claimed2 := public.claim_email_queue_row(v_qid, v_lease2, 120);
  if v_claimed2.id is null then
    raise exception 'expired lease was not reclaimable';
  end if;

  v_ok := public.finish_email_queue_sent(v_qid, v_lease, 'stale-worker');
  if v_ok then
    raise exception 'stale worker must not finish sent';
  end if;

  v_ok := public.finish_email_queue_sent(v_qid, v_lease2, 'resend:test');
  if v_ok is not true then
    raise exception 'current lease holder must finish sent';
  end if;

  if exists (
    select 1 from public.email_queue where id = v_qid and status <> 'sent'
  ) then
    raise exception 'queue row was not marked sent';
  end if;

  v_deleted := public.cleanup_delivery_otp_email_secrets();
  if exists (
    select 1 from public.delivery_otp_email_secrets where notification_id = v_nid
  ) then
    raise exception 'sent secret was not cleaned up';
  end if;

  -- Abandoned plaintext secret TTL.
  insert into public.notifications (user_id, type, title, body, link)
  values (v_uid, 'DELIVERY_OTP', 'Payment release code', 'queued', '/requests')
  returning id into v_nid;

  insert into public.delivery_otp_email_secrets (notification_id, otp, created_at)
  values (v_nid, '654321', now() - interval '25 hours');

  if public.cleanup_delivery_otp_email_secrets() < 1 then
    raise exception 'abandoned secret TTL cleanup failed';
  end if;

  if exists (
    select 1 from public.delivery_otp_email_secrets where notification_id = v_nid
  ) then
    raise exception 'abandoned secret still present';
  end if;

  raise notice 'email queue lease SQL tests passed (deleted=% )', v_deleted;
end;
$$;

rollback;
