-- Durable admin audit log for destructive Connect operations.
-- API roles have no grants and no RLS policies (default deny).
-- service_role writes from Edge Functions (BYPASSRLS).

begin;

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  actor_user_id uuid not null references public.profiles (id),
  action text not null,
  status text not null,
  target_user_id uuid references public.profiles (id),
  target_stripe_account_id text,
  metadata jsonb not null default '{}'::jsonb,
  constraint admin_audit_events_status_check
    check (status in ('STARTED', 'SUCCEEDED', 'FAILED')),
  constraint admin_audit_events_action_check
    check (char_length(action) between 1 and 80)
);

comment on table public.admin_audit_events is
  'Server-side audit trail for admin-only operations. Not exposed to anon/authenticated.';

create index if not exists admin_audit_events_actor_created_idx
  on public.admin_audit_events (actor_user_id, created_at desc);

create index if not exists admin_audit_events_target_account_idx
  on public.admin_audit_events (target_stripe_account_id, created_at desc)
  where target_stripe_account_id is not null;

create unique index if not exists admin_audit_events_delete_connect_in_progress_idx
  on public.admin_audit_events (target_stripe_account_id)
  where action = 'DELETE_STRIPE_CONNECT'
    and status = 'STARTED'
    and target_stripe_account_id is not null;

alter table public.admin_audit_events enable row level security;

revoke all on table public.admin_audit_events from public;
revoke all on table public.admin_audit_events from anon;
revoke all on table public.admin_audit_events from authenticated;

grant select, insert, update on table public.admin_audit_events to service_role;

commit;
