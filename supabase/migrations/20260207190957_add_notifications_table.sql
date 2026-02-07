create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null, -- who receives the notification

  type text not null, -- e.g. 'carry_request_accepted'

  title text not null,
  body text not null,

  link text null, -- e.g. /carry-requests/:id

  metadata jsonb null, -- optional structured data

  read_at timestamptz null,

  created_at timestamptz not null default now()
);

-- -----------------------------
-- Indexes (important)
-- -----------------------------

create index if not exists notifications_user_id_idx
on public.notifications (user_id);

create index if not exists notifications_created_at_idx
on public.notifications (created_at desc);

create index if not exists notifications_unread_idx
on public.notifications (user_id)
where read_at is null;
