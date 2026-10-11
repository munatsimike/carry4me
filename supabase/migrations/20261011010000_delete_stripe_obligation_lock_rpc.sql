-- Service-role helpers for delete-stripe-account.
-- EXISTS-based obligation checks cannot be truncated by PostgREST max_rows.
-- Profile reset is serialized on the STARTED audit lock row.

begin;

create or replace function public.find_carry_request_delete_obligations(
  p_traveler_user_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  blocker jsonb;
  payment_intent_ids jsonb;
begin
  if p_traveler_user_id is null then
    return jsonb_build_object('complete', false);
  end if;

  if exists (
    select 1
    from public.carry_requests
    where traveler_user_id = p_traveler_user_id
      and status in (
        'PENDING_ACCEPTANCE',
        'PENDING_PAYMENT',
        'PENDING_HANDOVER',
        'IN_TRANSIT',
        'PENDING_PAYOUT'
      )
  ) then
    blocker := jsonb_build_object(
      'code', 'ACTIVE_CARRY_REQUEST',
      'message', 'This traveler still has an active carry request.'
    );
  elsif exists (
    select 1
    from public.carry_requests
    where traveler_user_id = p_traveler_user_id
      and nullif(btrim(coalesce(stripe_dispute_id, '')), '') is not null
      and coalesce(dispute_status, '') not in (
        'won',
        'lost',
        'warning_closed',
        'charge_refunded'
      )
  ) then
    blocker := jsonb_build_object(
      'code', 'UNRESOLVED_DISPUTE',
      'message', 'This traveler has an unresolved payment dispute.'
    );
  elsif exists (
    select 1
    from public.carry_requests
    where traveler_user_id = p_traveler_user_id
      and (
        nullif(btrim(coalesce(stripe_refund_id, '')), '') is not null
        or nullif(btrim(coalesce(refund_status, '')), '') is not null
      )
      and coalesce(payment_status, '') not in ('REFUNDED_FULL', 'REFUNDED_PARTIAL')
  ) then
    blocker := jsonb_build_object(
      'code', 'PENDING_REFUND',
      'message', 'A refund is still pending on a request for this traveler.'
    );
  elsif exists (
    select 1
    from public.carry_requests
    where traveler_user_id = p_traveler_user_id
      and payment_status = 'SUCCEEDED'
      and nullif(btrim(coalesce(stripe_transfer_id, '')), '') is null
      and coalesce(status, '') not in ('CANCELLED', 'EXPIRED', 'REJECTED')
      and coalesce(payment_status, '') not in ('REFUNDED_FULL', 'REFUNDED_PARTIAL')
  ) then
    blocker := jsonb_build_object(
      'code', 'UNSETTLED_PAYOUT',
      'message', 'This traveler still has an unsettled payout.'
    );
  end if;

  select coalesce(
    jsonb_agg(btrim(stripe_payment_intent_id) order by id),
    '[]'::jsonb
  )
  into payment_intent_ids
  from public.carry_requests
  where traveler_user_id = p_traveler_user_id
    and nullif(btrim(coalesce(stripe_payment_intent_id, '')), '') is not null;

  return jsonb_build_object(
    'complete', true,
    'blocker', blocker,
    'payment_intent_ids', payment_intent_ids
  );
end;
$$;

create or replace function public.reset_connect_profile_for_delete(
  p_user_id uuid,
  p_stripe_account_id text,
  p_audit_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
begin
  if p_user_id is null
    or p_audit_id is null
    or nullif(btrim(coalesce(p_stripe_account_id, '')), '') is null
  then
    return jsonb_build_object('outcome', 'error');
  end if;

  perform 1
  from public.admin_audit_events
  where id = p_audit_id
    and action = 'DELETE_STRIPE_CONNECT'
    and status = 'STARTED'
    and target_user_id = p_user_id
    and target_stripe_account_id = p_stripe_account_id
  for update;

  if not found then
    return jsonb_build_object('outcome', 'lock_lost');
  end if;

  update public.profiles
  set
    stripe_account_id = null,
    stripe_charges_enabled = false,
    stripe_payouts_enabled = false,
    stripe_details_submitted = false,
    stripe_verification_status = 'not_started',
    updated_at = now()
  where id = p_user_id
    and stripe_account_id = p_stripe_account_id
  returning * into profile_row;

  if found then
    return jsonb_build_object(
      'outcome', 'cleared',
      'profile', jsonb_build_object(
        'id', profile_row.id,
        'email', profile_row.email,
        'full_name', profile_row.full_name,
        'phone_verified', profile_row.phone_verified,
        'email_verified', profile_row.email_verified,
        'country_code', profile_row.country_code,
        'country', profile_row.country,
        'stripe_account_id', profile_row.stripe_account_id,
        'stripe_charges_enabled', profile_row.stripe_charges_enabled,
        'stripe_payouts_enabled', profile_row.stripe_payouts_enabled,
        'stripe_details_submitted', profile_row.stripe_details_submitted,
        'stripe_verification_status', profile_row.stripe_verification_status
      )
    );
  end if;

  select * into profile_row
  from public.profiles
  where id = p_user_id;

  if not found then
    return jsonb_build_object('outcome', 'error');
  end if;

  if profile_row.stripe_account_id is null then
    return jsonb_build_object(
      'outcome', 'already_cleared',
      'profile', jsonb_build_object(
        'id', profile_row.id,
        'email', profile_row.email,
        'full_name', profile_row.full_name,
        'phone_verified', profile_row.phone_verified,
        'email_verified', profile_row.email_verified,
        'country_code', profile_row.country_code,
        'country', profile_row.country,
        'stripe_account_id', profile_row.stripe_account_id,
        'stripe_charges_enabled', profile_row.stripe_charges_enabled,
        'stripe_payouts_enabled', profile_row.stripe_payouts_enabled,
        'stripe_details_submitted', profile_row.stripe_details_submitted,
        'stripe_verification_status', profile_row.stripe_verification_status
      )
    );
  end if;

  if profile_row.stripe_account_id <> p_stripe_account_id then
    return jsonb_build_object(
      'outcome', 'replaced',
      'profile', jsonb_build_object(
        'id', profile_row.id,
        'email', profile_row.email,
        'full_name', profile_row.full_name,
        'phone_verified', profile_row.phone_verified,
        'email_verified', profile_row.email_verified,
        'country_code', profile_row.country_code,
        'country', profile_row.country,
        'stripe_account_id', profile_row.stripe_account_id,
        'stripe_charges_enabled', profile_row.stripe_charges_enabled,
        'stripe_payouts_enabled', profile_row.stripe_payouts_enabled,
        'stripe_details_submitted', profile_row.stripe_details_submitted,
        'stripe_verification_status', profile_row.stripe_verification_status
      )
    );
  end if;

  return jsonb_build_object(
    'outcome', 'unchanged',
    'profile', jsonb_build_object(
      'id', profile_row.id,
      'email', profile_row.email,
      'full_name', profile_row.full_name,
      'phone_verified', profile_row.phone_verified,
      'email_verified', profile_row.email_verified,
      'country_code', profile_row.country_code,
      'country', profile_row.country,
      'stripe_account_id', profile_row.stripe_account_id,
      'stripe_charges_enabled', profile_row.stripe_charges_enabled,
      'stripe_payouts_enabled', profile_row.stripe_payouts_enabled,
      'stripe_details_submitted', profile_row.stripe_details_submitted,
      'stripe_verification_status', profile_row.stripe_verification_status
    )
  );
end;
$$;

create or replace function public.patch_started_delete_audit_metadata(
  p_audit_id uuid,
  p_patch jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.admin_audit_events
  set
    metadata = coalesce(metadata, '{}'::jsonb) || coalesce(p_patch, '{}'::jsonb),
    updated_at = now()
  where id = p_audit_id
    and action = 'DELETE_STRIPE_CONNECT'
    and status = 'STARTED';

  return found;
end;
$$;

create or replace function public.cas_finish_delete_audit(
  p_audit_id uuid,
  p_status text,
  p_metadata jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('SUCCEEDED', 'FAILED') then
    return false;
  end if;

  if p_status = 'SUCCEEDED'
    and (
      coalesce((p_metadata->>'stripe_deleted')::boolean, false) is not true
      or coalesce((p_metadata->>'profile_cleared')::boolean, false) is not true
    )
  then
    return false;
  end if;

  update public.admin_audit_events
  set
    status = p_status,
    metadata = coalesce(metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb),
    updated_at = now()
  where id = p_audit_id
    and action = 'DELETE_STRIPE_CONNECT'
    and status = 'STARTED';

  return found;
end;
$$;

revoke all on function public.find_carry_request_delete_obligations(uuid) from public;
revoke all on function public.find_carry_request_delete_obligations(uuid) from anon;
revoke all on function public.find_carry_request_delete_obligations(uuid) from authenticated;
grant execute on function public.find_carry_request_delete_obligations(uuid) to service_role;

revoke all on function public.reset_connect_profile_for_delete(uuid, text, uuid) from public;
revoke all on function public.reset_connect_profile_for_delete(uuid, text, uuid) from anon;
revoke all on function public.reset_connect_profile_for_delete(uuid, text, uuid) from authenticated;
grant execute on function public.reset_connect_profile_for_delete(uuid, text, uuid) to service_role;

revoke all on function public.patch_started_delete_audit_metadata(uuid, jsonb) from public;
revoke all on function public.patch_started_delete_audit_metadata(uuid, jsonb) from anon;
revoke all on function public.patch_started_delete_audit_metadata(uuid, jsonb) from authenticated;
grant execute on function public.patch_started_delete_audit_metadata(uuid, jsonb) to service_role;

revoke all on function public.cas_finish_delete_audit(uuid, text, jsonb) from public;
revoke all on function public.cas_finish_delete_audit(uuid, text, jsonb) from anon;
revoke all on function public.cas_finish_delete_audit(uuid, text, jsonb) from authenticated;
grant execute on function public.cas_finish_delete_audit(uuid, text, jsonb) to service_role;

commit;
