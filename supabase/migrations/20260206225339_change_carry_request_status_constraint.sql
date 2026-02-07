alter table public.carry_requests
drop constraint carry_requests_status_check;

alter table public.carry_requests
alter column status set default 'pending_acceptance',
alter column status set not null;

alter table public.carry_requests
add constraint carry_requests_status_check
check (
  status in (
    'pending_acceptance',
    'rejected',
    'cancelled',
    'pending_payment',
    'pending_handover',
    'in_transit',
    'pending_payout',
    'paid_out'
  )
);


