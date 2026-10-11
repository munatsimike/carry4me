-- Email queue leases, atomic OTP cooldown, server-side retry, secret TTL.
-- Does not change verify_delivery_otp or payout rules.
--
-- Coordinated rollout (do not apply 40000 without 30000):
--   1. 20261011020000 (carry_requests SELECT allowlist) may go first; frontend
--      must not select delivery_otp_hash.
--   2. 20261011030000 (delivery_otp_email_secrets) and this migration must be
--      applied before or in the same window as Edge Functions
--      process-email-queue, generate-delivery-otp, and send-notification-email.
--   3. Deploy those functions immediately after 30000+40000. Old workers peek
--      then send without a lease; new workers call claim_* RPCs that do not
--      exist until this migration.
--   4. Do not deploy generate-delivery-otp that returns "sent" before the
--      provider accepts. Keep process-email-queue drain on a schedule
--      (service_role + {"drain":true}); pg_cron here only reclaims leases and
--      deletes abandoned secrets — it cannot call Resend.
--
-- Remaining exactly-once races (DB locks cannot close these):
--   * Worker sends, provider accepts, then CAS finish loses (lease expired or
--     OTP superseded). Resend Idempotency-Key is carry4me-email-queue-{id}.
--     A retry of the same queue row should reuse that send; a superseded OTP
--     may still be delivered if the HTTP call already left this process.
--   * Provider timeout / crash after accept and before finish: lease reclaim
--     retries with the same idempotency key (at-least-once if Resend ignores
--     the key).
--   * Two in-flight workers on the same row cannot both claim; they can both
--     observe a lost lease after a send that already happened.

begin;

update public.email_queue
set status = 'pending'
where status = 'skipped';

alter table public.email_queue
  add column if not exists lease_token uuid,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists next_attempt_at timestamptz not null default now();

do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.email_queue'::regclass
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%'
  loop
    execute format('alter table public.email_queue drop constraint %I', r.conname);
  end loop;
end;
$$;

alter table public.email_queue
  add constraint email_queue_status_check
  check (status in ('pending', 'processing', 'sent', 'failed'));

create index if not exists email_queue_due_idx
  on public.email_queue (next_attempt_at)
  where status in ('pending', 'failed', 'processing');

-- ---------------------------------------------------------------------------
-- Notification copy: queued vs sent vs failed (does not include OTP digits)
-- ---------------------------------------------------------------------------
create or replace function public.sender_payment_code_notification_body(
  p_preference text,
  p_email_status text
)
returns text
language sql
immutable
as $$
  select case coalesce(nullif(lower(trim(p_email_status)), ''), 'queued')
    when 'sent' then
      case coalesce(nullif(lower(trim(p_preference)), ''), 'flexible')
        when 'handover' then
          'A delivery code was sent to your email. Give it to the traveler after parcel handover to release payment.'
        when 'delivery' then
          'A delivery code was sent to your email. Give it to the traveler after successful delivery to release payment.'
        else
          'A delivery code was sent to your email. Give it to the traveler after parcel handover or after successful delivery to release payment.'
      end
    when 'failed' then
      'We couldn''t email your delivery code. Open the request and tap Resend to try again.'
    else
      case coalesce(nullif(lower(trim(p_preference)), ''), 'flexible')
        when 'handover' then
          'We''re sending a delivery code to your email. Give it to the traveler after parcel handover once it arrives.'
        when 'delivery' then
          'We''re sending a delivery code to your email. Give it to the traveler after successful delivery once it arrives.'
        else
          'We''re sending a delivery code to your email. Give it to the traveler after parcel handover or after successful delivery once it arrives.'
      end
  end;
$$;

create or replace function public.sender_payment_code_notification_body(p_preference text)
returns text
language sql
immutable
as $$
  select public.sender_payment_code_notification_body(p_preference, 'queued');
$$;

create or replace function public.set_delivery_otp_notification_email_status(
  p_notification_id uuid,
  p_email_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pref text;
begin
  if p_email_status not in ('queued', 'sent', 'failed') then
    raise exception 'invalid delivery otp email status';
  end if;

  select coalesce(n.metadata ->> 'payment_preference', 'flexible')
  into v_pref
  from public.notifications n
  where n.id = p_notification_id
    and n.type = 'DELIVERY_OTP';

  if not found then
    return;
  end if;

  update public.notifications
  set
    body = public.sender_payment_code_notification_body(v_pref, p_email_status),
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('email_status', p_email_status)
  where id = p_notification_id
    and type = 'DELIVERY_OTP';
end;
$$;

-- ---------------------------------------------------------------------------
-- Claim / finish (SKIP LOCKED). service_role only.
-- ---------------------------------------------------------------------------
create or replace function public.claim_email_queue_row(
  p_id uuid,
  p_lease_token uuid,
  p_lease_seconds integer default 120
)
returns public.email_queue
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.email_queue;
begin
  if p_lease_token is null then
    raise exception 'lease token required';
  end if;

  update public.email_queue q
  set
    status = 'processing',
    lease_token = p_lease_token,
    lease_expires_at = now() + make_interval(secs => greatest(p_lease_seconds, 30))
  where q.id = p_id
    and coalesce(q.last_error, '') is distinct from 'otp_superseded'
    and q.attempts < 5
    and q.next_attempt_at <= now()
    and (
      q.status in ('pending', 'failed')
      or (q.status = 'processing' and q.lease_expires_at is not null and q.lease_expires_at <= now())
    )
  returning q.* into claimed;

  return claimed;
end;
$$;

create or replace function public.claim_due_email_queue(
  p_limit integer default 20,
  p_lease_seconds integer default 120
)
returns setof public.email_queue
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select q.id
    from public.email_queue q
    where coalesce(q.last_error, '') is distinct from 'otp_superseded'
      and q.attempts < 5
      and q.next_attempt_at <= now()
      and (
        q.status in ('pending', 'failed')
        or (q.status = 'processing' and q.lease_expires_at is not null and q.lease_expires_at <= now())
      )
    order by q.next_attempt_at asc, q.created_at asc
    limit greatest(p_limit, 1)
    for update skip locked
  )
  update public.email_queue q
  set
    status = 'processing',
    lease_token = gen_random_uuid(),
    lease_expires_at = now() + make_interval(secs => greatest(p_lease_seconds, 30))
  from due
  where q.id = due.id
  returning q.*;
end;
$$;

create or replace function public.email_queue_lease_is_active(
  p_id uuid,
  p_lease_token uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.email_queue q
    where q.id = p_id
      and q.lease_token = p_lease_token
      and q.status = 'processing'
      and q.lease_expires_at is not null
      and q.lease_expires_at > now()
      and coalesce(q.last_error, '') is distinct from 'otp_superseded'
  );
$$;

create or replace function public.finish_email_queue_sent(
  p_id uuid,
  p_lease_token uuid,
  p_provider_note text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
  v_updated int;
begin
  update public.email_queue
  set
    status = 'sent',
    attempts = attempts,
    sent_at = now(),
    last_error = left(coalesce(p_provider_note, ''), 500),
    lease_token = null,
    lease_expires_at = null
  where id = p_id
    and lease_token = p_lease_token
    and status = 'processing'
    and coalesce(last_error, '') is distinct from 'otp_superseded'
  returning notification_id into v_notification_id;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    return false;
  end if;

  perform public.set_delivery_otp_notification_email_status(v_notification_id, 'sent');
  return true;
end;
$$;

create or replace function public.finish_email_queue_failed(
  p_id uuid,
  p_lease_token uuid,
  p_error text,
  p_terminal boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
  v_attempts int;
  v_updated int;
  v_delay interval;
begin
  select attempts + 1, notification_id
  into v_attempts, v_notification_id
  from public.email_queue
  where id = p_id
    and lease_token = p_lease_token
    and status = 'processing'
  for update;

  if not found then
    return false;
  end if;

  v_delay := least(
    interval '15 minutes',
    interval '15 seconds' * power(2, greatest(v_attempts - 1, 0))
  );

  update public.email_queue
  set
    status = 'failed',
    attempts = v_attempts,
    last_error = left(coalesce(p_error, 'failed'), 500),
    sent_at = null,
    lease_token = null,
    lease_expires_at = null,
    next_attempt_at = case
      when p_terminal or v_attempts >= 5 or coalesce(p_error, '') = 'otp_superseded'
        then now() + interval '100 years'
      else now() + v_delay
    end
  where id = p_id
    and lease_token = p_lease_token
    and status = 'processing';

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    return false;
  end if;

  if p_terminal or v_attempts >= 5 or coalesce(p_error, '') = 'otp_superseded' then
    perform public.set_delivery_otp_notification_email_status(v_notification_id, 'failed');
  end if;

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Secret TTL / terminal cleanup
-- ---------------------------------------------------------------------------
create or replace function public.cleanup_delivery_otp_email_secrets()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
begin
  delete from public.delivery_otp_email_secrets s
  where s.created_at < now() - interval '24 hours'
     or exists (
       select 1
       from public.email_queue q
       where q.notification_id = s.notification_id
         and (
           q.status = 'sent'
           or coalesce(q.last_error, '') in (
             'otp_superseded',
             'otp_secret_missing',
             'max_attempts_reached:5'
           )
           or q.attempts >= 5
         )
     );

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

create or replace function public.reclaim_stale_email_queue_leases()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n int;
begin
  update public.email_queue
  set
    status = 'failed',
    lease_token = null,
    lease_expires_at = null,
    next_attempt_at = now()
  where status = 'processing'
    and lease_expires_at is not null
    and lease_expires_at <= now();

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- ---------------------------------------------------------------------------
-- Atomic OTP issue + cooldown (row lock)
-- ---------------------------------------------------------------------------
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
  v_updated int;
begin
  select * into cr
  from public.carry_requests
  where id = p_request_id
  for update;

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

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    return jsonb_build_object('ok', false, 'reason', 'ISSUE_FAILED');
  end if;

  select coalesce(p.payment_preference, 'flexible')
  into v_preference
  from public.parcels p
  where p.id = cr.parcel_id;

  v_preference := coalesce(v_preference, 'flexible');

  delete from public.delivery_otp_email_secrets s
  using public.notifications n
  where s.notification_id = n.id
    and n.type = 'DELIVERY_OTP'
    and n.metadata ->> 'carry_request_id' = p_request_id::text;

  update public.email_queue q
  set
    status = 'failed',
    last_error = 'otp_superseded',
    lease_token = null,
    lease_expires_at = now() - interval '1 second',
    next_attempt_at = now() + interval '100 years'
  from public.notifications n
  where q.notification_id = n.id
    and n.type = 'DELIVERY_OTP'
    and n.metadata ->> 'carry_request_id' = p_request_id::text
    and q.status in ('pending', 'failed', 'processing');

  update public.notifications n
  set
    body = public.sender_payment_code_notification_body(
      coalesce(n.metadata ->> 'payment_preference', v_preference),
      'failed'
    ),
    metadata = coalesce(n.metadata, '{}'::jsonb) || jsonb_build_object('email_status', 'superseded')
  where n.type = 'DELIVERY_OTP'
    and n.metadata ->> 'carry_request_id' = p_request_id::text;

  insert into public.notifications (user_id, type, title, body, link, metadata)
  values (
    cr.sender_user_id,
    'DELIVERY_OTP',
    'Payment release code',
    public.sender_payment_code_notification_body(v_preference, 'queued'),
    '/requests',
    jsonb_build_object(
      'carry_request_id', p_request_id,
      'payment_preference', v_preference,
      'email_status', 'queued'
    )
  )
  returning id into notification_id;

  insert into public.email_queue (notification_id, user_id, status, next_attempt_at)
  values (notification_id, cr.sender_user_id, 'pending', now());

  insert into public.delivery_otp_email_secrets (notification_id, otp)
  values (notification_id, v_otp);

  return jsonb_build_object(
    'ok', true,
    'notification_id', notification_id
  );
end;
$$;

revoke all on function public.sender_payment_code_notification_body(text) from public, anon, authenticated;
revoke all on function public.sender_payment_code_notification_body(text, text) from public, anon, authenticated;
revoke all on function public.set_delivery_otp_notification_email_status(uuid, text) from public, anon, authenticated;
revoke all on function public.claim_email_queue_row(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.claim_due_email_queue(integer, integer) from public, anon, authenticated;
revoke all on function public.email_queue_lease_is_active(uuid, uuid) from public, anon, authenticated;
revoke all on function public.finish_email_queue_sent(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.finish_email_queue_failed(uuid, uuid, text, boolean) from public, anon, authenticated;
revoke all on function public.cleanup_delivery_otp_email_secrets() from public, anon, authenticated;
revoke all on function public.reclaim_stale_email_queue_leases() from public, anon, authenticated;
revoke all on function public.issue_delivery_otp(uuid) from public, anon, authenticated;

grant execute on function public.sender_payment_code_notification_body(text) to service_role;
grant execute on function public.sender_payment_code_notification_body(text, text) to service_role;
grant execute on function public.set_delivery_otp_notification_email_status(uuid, text) to service_role;
grant execute on function public.claim_email_queue_row(uuid, uuid, integer) to service_role;
grant execute on function public.claim_due_email_queue(integer, integer) to service_role;
grant execute on function public.email_queue_lease_is_active(uuid, uuid) to service_role;
grant execute on function public.finish_email_queue_sent(uuid, uuid, text) to service_role;
grant execute on function public.finish_email_queue_failed(uuid, uuid, text, boolean) to service_role;
grant execute on function public.cleanup_delivery_otp_email_secrets() to service_role;
grant execute on function public.reclaim_stale_email_queue_leases() to service_role;
grant execute on function public.issue_delivery_otp(uuid) to service_role;

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron not enabled; schedule process-email-queue drain separately.';
    return;
  end if;

  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'cleanup-delivery-otp-email-secrets';

  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'reclaim-stale-email-queue-leases';

  perform cron.schedule(
    'cleanup-delivery-otp-email-secrets',
    '*/10 * * * *',
    $cron$select public.cleanup_delivery_otp_email_secrets();$cron$
  );

  perform cron.schedule(
    'reclaim-stale-email-queue-leases',
    '* * * * *',
    $cron$select public.reclaim_stale_email_queue_leases();$cron$
  );
exception
  when others then
    raise notice 'email queue cron not scheduled: %', sqlerrm;
end;
$$;

commit;
