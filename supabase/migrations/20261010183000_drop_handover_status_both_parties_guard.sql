-- Revert the extra handover status guard; both-party confirm is already
-- enforced inside perform_carry_request_action.

drop trigger if exists carry_requests_handover_requires_both_parties
on public.carry_requests;

drop function if exists public.enforce_handover_status_requires_both_parties();
drop function if exists public.carry_request_both_parties_confirmed_handover(uuid);
