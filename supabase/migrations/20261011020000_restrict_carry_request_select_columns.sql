-- Stop authenticated senders/travellers reading delivery_otp_hash via
-- PostgREST or Realtime.
--
-- Table-level GRANT SELECT includes every column and overrides a later
-- column REVOKE. Replace it with an explicit column allowlist.
--
-- Does not change RLS, OTP issue/verify RPCs, expiry, or payment functions.
-- service_role and table-owner SECURITY DEFINER RPCs keep full column access.
--
-- Remaining client-readable identifiers (not this fix):
--   stripe_payment_intent_id (payment-window UI)
--   stripe_refund_id, stripe_transfer_id, stripe_dispute_id
-- Do not grant delivery_otp_hash. Do not auto-grant future columns.

begin;

-- ---------------------------------------------------------------------------
-- 1) Drop table-level and leftover column SELECT for API roles.
--    REVOKE ALL first so PUBLIC / default grants cannot keep table SELECT.
-- ---------------------------------------------------------------------------
revoke all on table public.carry_requests from public;
revoke all on table public.carry_requests from anon;
revoke all on table public.carry_requests from authenticated;

do $$
declare
  col text;
begin
  for col in
    select a.attname
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'carry_requests'
      and a.attnum > 0
      and not a.attisdropped
  loop
    execute format(
      'revoke select (%I) on table public.carry_requests from public, anon, authenticated',
      col
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) Restore INSERT and service_role DML. Table INSERT is required for
--    create-request. Direct UPDATE/DELETE stay revoked for API roles.
-- ---------------------------------------------------------------------------
grant insert on table public.carry_requests to authenticated;
grant select, insert, update, delete on table public.carry_requests to service_role;

-- ---------------------------------------------------------------------------
-- 3) Explicit SELECT allowlist for authenticated (every current column
--    except delivery_otp_hash). Fail if the catalog and this list diverge
--    so a later secret column cannot slip through unnoticed.
-- ---------------------------------------------------------------------------
do $$
declare
  allowlist text[] := array[
    'id',
    'trip_id',
    'parcel_id',
    'sender_user_id',
    'traveler_user_id',
    'status',
    'created_at',
    'updated_at',
    'initiator_role',
    'parcel_snapshot',
    'trip_snapshot',
    'payment_expires_at',
    'expired_at',
    'reserved_kg',
    'capacity_reserved_at',
    'capacity_released_at',
    'capacity_consumed_at',
    'stripe_payment_intent_id',
    'payment_status',
    'payment_amount',
    'payment_currency',
    'platform_fee_amount',
    'traveler_payout_amount',
    'delivery_otp_expires_at',
    'delivery_otp_attempts',
    'delivery_otp_verified_at',
    'delivery_otp_last_sent_at',
    'refund_status',
    'refunded_amount',
    'stripe_refund_id',
    'refunded_at',
    'refund_actor_role',
    'stripe_transfer_id',
    'stripe_dispute_id',
    'dispute_status',
    'dispute_reason',
    'disputed_amount',
    'disputed_at',
    'dispute_closed_at',
    'payment_preference'
  ];
  catalog_cols text[];
  extra text[];
  missing text[];
  quoted text;
begin
  select coalesce(array_agg(a.attname order by a.attnum), '{}')
  into catalog_cols
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'carry_requests'
    and a.attnum > 0
    and not a.attisdropped
    and a.attname <> 'delivery_otp_hash';

  select coalesce(array_agg(x order by x), '{}')
  into extra
  from unnest(catalog_cols) as x
  where x <> all (allowlist);

  select coalesce(array_agg(x order by x), '{}')
  into missing
  from unnest(allowlist) as x
  where x <> all (catalog_cols);

  if extra <> '{}' then
    raise exception
      'carry_requests SELECT allowlist is missing column(s) % — add to the allowlist or exclude as secret',
      extra;
  end if;

  if missing <> '{}' then
    raise exception
      'carry_requests SELECT allowlist names unknown column(s) %',
      missing;
  end if;

  if 'delivery_otp_hash' = any (allowlist) then
    raise exception 'delivery_otp_hash must not be in the authenticated SELECT allowlist';
  end if;

  select string_agg(format('%I', col), ', ' order by ordinality)
  into quoted
  from unnest(allowlist) with ordinality as t(col, ordinality);

  execute format(
    'grant select (%s) on table public.carry_requests to authenticated',
    quoted
  );
end;
$$;

comment on column public.carry_requests.delivery_otp_hash is
  'Server-only OTP digest. Not granted to anon/authenticated; PostgREST and Realtime must omit it.';

-- ---------------------------------------------------------------------------
-- 4) Internal OTP helpers must not be callable through PostgREST.
--    CREATE FUNCTION default-grants authenticated/anon EXECUTE even after
--    REVOKE FROM PUBLIC. issue/verify stay SECURITY DEFINER; issue is
--    service_role-only, verify stays authenticated (traveller UI).
-- ---------------------------------------------------------------------------
revoke all on function public.hash_delivery_otp(uuid, text) from public, anon, authenticated;
revoke all on function public.generate_secure_otp_6() from public, anon, authenticated;
revoke all on function public.issue_delivery_otp(uuid) from public, anon, authenticated;

grant execute on function public.hash_delivery_otp(uuid, text) to service_role;
grant execute on function public.generate_secure_otp_6() to service_role;
grant execute on function public.issue_delivery_otp(uuid) to service_role;
grant execute on function public.verify_delivery_otp(uuid, text) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- Verification (read-only; run after apply)
-- ---------------------------------------------------------------------------
--
-- -- No table-level SELECT for API roles (column grants do not appear here):
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name = 'carry_requests'
--   and grantee in ('anon', 'authenticated', 'service_role', 'PUBLIC')
-- order by grantee, privilege_type;
-- -- authenticated: INSERT only
-- -- anon / PUBLIC: none
-- -- service_role: SELECT, INSERT, UPDATE, DELETE
--
-- select has_column_privilege('authenticated', 'public.carry_requests', 'delivery_otp_hash', 'SELECT');
-- -- false
--
-- select has_column_privilege('authenticated', 'public.carry_requests', 'id', 'SELECT');
-- -- true
--
-- select has_column_privilege('anon', 'public.carry_requests', 'delivery_otp_hash', 'SELECT');
-- -- false
--
-- select has_column_privilege('service_role', 'public.carry_requests', 'delivery_otp_hash', 'SELECT');
-- -- true
--
-- -- PostgREST: GET /rest/v1/carry_requests?select=delivery_otp_hash  → 403 / 42501
-- -- PostgREST: GET /rest/v1/carry_requests?select=id,status          → 200 (RLS)
-- -- Realtime postgres_changes payloads omit delivery_otp_hash for JWT role authenticated
--
-- ---------------------------------------------------------------------------
-- Rollback (restores the previous table-level SELECT; do not use in production)
-- ---------------------------------------------------------------------------
--
-- begin;
-- revoke all on table public.carry_requests from public, anon, authenticated;
-- grant select, insert on table public.carry_requests to authenticated;
-- grant select, insert, update, delete on table public.carry_requests to service_role;
-- commit;
