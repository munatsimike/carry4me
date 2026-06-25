-- Payment window: 4 hours (240 minutes) after a request is accepted.

insert into public.platform_settings (key, value, description)
values (
  'payment_window_minutes',
  '240',
  'Minutes allowed for payment before a carry request expires (240 = 4 hours)'
)
on conflict (key) do update
set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

-- Extend active payment windows that would expire sooner than the new default.
update public.carry_requests
set
  payment_expires_at = greatest(
    payment_expires_at,
    now() + interval '4 hours'
  ),
  updated_at = now()
where status = 'PENDING_PAYMENT'
  and payment_expires_at is not null
  and payment_expires_at < now() + interval '4 hours';
