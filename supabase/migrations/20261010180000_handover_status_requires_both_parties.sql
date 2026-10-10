-- Request status may leave PENDING_HANDOVER only after both parties confirm.

create or replace function public.carry_request_both_parties_confirmed_handover(
  p_request_id uuid
)
returns boolean
language sql
stable
as $$
  select
    coalesce(bool_or(c.role = 'SENDER'::public.handover_role), false)
    and coalesce(bool_or(c.role = 'TRAVELER'::public.handover_role), false)
  from public.carry_request_handover_confirmations c
  where c.carry_request_id = p_request_id
    and c.confirmed_at is not null;
$$;

create or replace function public.enforce_handover_status_requires_both_parties()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'PENDING_HANDOVER'
     and new.status in ('IN_TRANSIT', 'PENDING_PAYOUT')
     and not public.carry_request_both_parties_confirmed_handover(new.id)
  then
    new.status := 'PENDING_HANDOVER';
  end if;

  return new;
end;
$$;

drop trigger if exists carry_requests_handover_requires_both_parties
on public.carry_requests;

create trigger carry_requests_handover_requires_both_parties
before update of status on public.carry_requests
for each row
execute function public.enforce_handover_status_requires_both_parties();
