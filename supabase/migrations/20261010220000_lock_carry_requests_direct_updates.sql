-- Lock direct UPDATE/DELETE on public.carry_requests for API roles.
-- Status, payment, OTP, Stripe, and payout writes must go through
-- SECURITY DEFINER RPCs or the service_role Edge Functions.
--
-- Does not change RPC bodies. Does not enable FORCE ROW LEVEL SECURITY.
-- Do not apply until reviewed. Rollback SQL is in the comments at the end.

begin;

-- ---------------------------------------------------------------------------
-- 1) Table-level privileges
--    REVOKE ALL first so leftover default/PUBLIC grants cannot keep UPDATE.
-- ---------------------------------------------------------------------------
revoke all on table public.carry_requests from public;
revoke all on table public.carry_requests from anon;
revoke all on table public.carry_requests from authenticated;

grant select, insert on table public.carry_requests to authenticated;
grant select, insert, update, delete on table public.carry_requests to service_role;

-- ---------------------------------------------------------------------------
-- 2) Column-level UPDATE grants
--    Table REVOKE does not remove GRANT UPDATE (column) privileges.
-- ---------------------------------------------------------------------------
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
      'revoke update (%I) on table public.carry_requests from public, anon, authenticated',
      col
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) UPDATE RLS: deny even if table UPDATE is later re-granted.
--    Table owner / service_role are unaffected (no FORCE RLS).
-- ---------------------------------------------------------------------------
drop policy if exists carry_requests_update_participant_not_suspended
  on public.carry_requests;

drop policy if exists carry_requests_update_blocked
  on public.carry_requests;

create policy carry_requests_update_blocked
on public.carry_requests
for update
to anon, authenticated
using (false)
with check (false);

-- Existing SELECT / INSERT / DELETE policies are unchanged:
--   carry_requests_select_participant
--   carry_requests_insert_active_initiator
--   carry_requests_delete_blocked

commit;

-- ---------------------------------------------------------------------------
-- Verification (read-only; run after apply)
-- ---------------------------------------------------------------------------
--
-- select c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relname = 'carry_requests';
-- -- expect rls_enabled = true, rls_forced = false
--
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name = 'carry_requests'
--   and grantee in ('anon', 'authenticated', 'service_role', 'PUBLIC')
-- order by grantee, privilege_type;
-- -- authenticated: SELECT, INSERT only
-- -- anon / PUBLIC: none
-- -- service_role: SELECT, INSERT, UPDATE, DELETE
--
-- select grantee, column_name, privilege_type
-- from information_schema.column_privileges
-- where table_schema = 'public'
--   and table_name = 'carry_requests'
--   and privilege_type = 'UPDATE'
--   and grantee in ('anon', 'authenticated', 'PUBLIC');
-- -- expect zero rows
--
-- select pol.polname,
--        case pol.polcmd
--          when 'r' then 'SELECT' when 'a' then 'INSERT'
--          when 'w' then 'UPDATE' when 'd' then 'DELETE'
--        end as command,
--        pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
--        pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr
-- from pg_policy pol
-- join pg_class c on c.oid = pol.polrelid
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relname = 'carry_requests'
-- order by pol.polname;
-- -- UPDATE policy must be carry_requests_update_blocked with using/check false
-- -- carry_requests_update_participant_not_suspended must be absent
--
-- ---------------------------------------------------------------------------
-- Rollback
-- ---------------------------------------------------------------------------
--
-- begin;
--
-- drop policy if exists carry_requests_update_blocked on public.carry_requests;
--
-- create policy carry_requests_update_participant_not_suspended
-- on public.carry_requests
-- for update
-- to authenticated
-- using (
--   public.current_account_is_not_suspended()
--   and (sender_user_id = auth.uid() or traveler_user_id = auth.uid())
-- )
-- with check (
--   public.current_account_is_not_suspended()
--   and (sender_user_id = auth.uid() or traveler_user_id = auth.uid())
-- );
--
-- grant select, insert, update, delete on table public.carry_requests to authenticated;
-- -- Live previously also had UPDATE for anon (leftover defaults). Restore only
-- -- if you intentionally need that insecure grant:
-- -- grant update on table public.carry_requests to anon;
--
-- commit;
