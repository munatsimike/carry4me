-- Flexible and after-delivery terms release payout only after delivery.
-- After-handover is the only timing that pays out before delivery.

create or replace function public.carry_request_allows_payout_at_handover(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.carry_request_agreed_payment_preference(p_request_id),
    'delivery'
  ) = 'handover';
$$;

revoke all on function public.carry_request_allows_payout_at_handover(uuid) from public;
