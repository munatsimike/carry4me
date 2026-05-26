-- Stripe Connect (profiles) and PaymentIntent tracking (carry_requests).

alter table public.profiles
  add column if not exists stripe_account_id text,
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_payouts_enabled boolean not null default false,
  add column if not exists stripe_details_submitted boolean not null default false,
  add column if not exists stripe_verification_status text not null default 'not_started';

alter table public.carry_requests
  add column if not exists stripe_payment_intent_id text,
  add column if not exists payment_status text,
  add column if not exists payment_amount integer,
  add column if not exists payment_currency text,
  add column if not exists platform_fee_amount integer,
  add column if not exists traveler_payout_amount integer;

create unique index if not exists carry_requests_stripe_payment_intent_id_idx
  on public.carry_requests (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

comment on column public.profiles.stripe_payouts_enabled is
  'Stripe Connect payouts_enabled — required before accepting paid carry requests.';

-- Webhook / edge: complete payment transition (same outcome as perform_carry_request_action PAY).
create or replace function public.finalize_carry_request_payment(
  p_request_id uuid,
  p_stripe_payment_intent_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cr record;
begin
  select * into cr
  from public.carry_requests
  where id = p_request_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;

  if cr.stripe_payment_intent_id is distinct from p_stripe_payment_intent_id then
    return jsonb_build_object('ok', false, 'reason', 'PAYMENT_INTENT_MISMATCH');
  end if;

  if cr.status = 'PENDING_HANDOVER' then
    return jsonb_build_object('ok', true, 'reason', 'ALREADY_PAID');
  end if;

  if cr.status <> 'PENDING_PAYMENT' then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_STATUS');
  end if;

  update public.carry_requests
  set
    status = 'PENDING_HANDOVER',
    payment_status = 'SUCCEEDED',
    payment_expires_at = null,
    updated_at = now()
  where id = p_request_id;

  insert into public.carry_request_events (
    carry_request_id,
    type,
    actor_user_id,
    metadata
  )
  values (
    p_request_id,
    'PAYMENT_COMPLETED',
    cr.sender_user_id,
    jsonb_build_object('source', 'stripe')
  );

  return jsonb_build_object(
    'ok', true,
    'event_type', 'PAYMENT_COMPLETED',
    'new_status', 'PENDING_HANDOVER'
  );
end;
$$;

revoke all on function public.finalize_carry_request_payment(uuid, text) from public;
grant execute on function public.finalize_carry_request_payment(uuid, text) to service_role;
