create table if not exists public.carry_request_handover_confirmations (
  id uuid primary key default gen_random_uuid(),

  carry_request_id uuid not null
    references public.carry_requests(id)
    on delete cascade,

  user_id uuid not null,

  role text not null
    check (role in ('sender', 'traveler')),

  confirmed_at timestamptz not null default now(),

  -- One confirmation per role per request
  unique (carry_request_id, role)
);

-- Indexes
create index if not exists carry_request_handover_confirmations_request_id_idx
on public.carry_request_handover_confirmations (carry_request_id);

create index if not exists carry_request_handover_confirmations_user_id_idx
on public.carry_request_handover_confirmations (user_id);
