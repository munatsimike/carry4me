-- Track Stripe card disputes on carry requests (chargebacks).

alter table public.carry_requests
  add column if not exists stripe_dispute_id text,
  add column if not exists dispute_status text,
  add column if not exists dispute_reason text,
  add column if not exists disputed_amount integer,
  add column if not exists disputed_at timestamptz,
  add column if not exists dispute_closed_at timestamptz;

create index if not exists carry_requests_stripe_dispute_id_idx
  on public.carry_requests (stripe_dispute_id)
  where stripe_dispute_id is not null;

comment on column public.carry_requests.dispute_status is
  'Stripe dispute status: needs_response | warning_needs_response | warning_under_review | under_review | won | lost | warning_closed | charge_refunded | etc.';
comment on column public.carry_requests.stripe_dispute_id is
  'Stripe dispute id (dp_…).';
