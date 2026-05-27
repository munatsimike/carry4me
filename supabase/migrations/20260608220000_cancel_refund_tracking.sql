-- Track Stripe refunds when a carry request is cancelled after payment.

alter table public.carry_requests
  add column if not exists refund_status text,
  add column if not exists refunded_amount integer,
  add column if not exists stripe_refund_id text,
  add column if not exists refunded_at timestamptz,
  add column if not exists refund_actor_role text;

create index if not exists carry_requests_stripe_refund_id_idx
  on public.carry_requests (stripe_refund_id)
  where stripe_refund_id is not null;

comment on column public.carry_requests.refund_status is
  'null | FULL | PARTIAL. PARTIAL means service fee retained.';
comment on column public.carry_requests.refund_actor_role is
  'Role that triggered cancellation refund: SENDER or TRAVELER.';

