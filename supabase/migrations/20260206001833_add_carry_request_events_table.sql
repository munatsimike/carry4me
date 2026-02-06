-- Create carry_request_events table
create table if not exists public.carry_request_events (
  id uuid primary key default gen_random_uuid(),

  carry_request_id uuid not null
    references public.carry_requests(id)
    on delete cascade,

  type text not null,
  actor_user_id uuid not null,

  metadata jsonb null,

  created_at timestamptz not null default now()
);

-- ----------------------------
-- Constraints
-- ----------------------------

-- Restrict event types (extend later as needed)
alter table public.carry_request_events
add constraint carry_request_events_type_check
check (type in (
  'request_sent',
  'accepted',
  'rejected',
  'cancelled',
  'payment_made',
  'handover_confirmed',
  'delivered'
));

-- ----------------------------
-- Indexes (important for performance)
-- ----------------------------

create index if not exists carry_request_events_request_id_idx
on public.carry_request_events (carry_request_id);

create index if not exists carry_request_events_actor_user_id_idx
on public.carry_request_events (actor_user_id);

create index if not exists carry_request_events_created_at_idx
on public.carry_request_events (created_at);
