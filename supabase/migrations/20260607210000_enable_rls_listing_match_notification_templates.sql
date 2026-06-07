-- Security Advisor fix: enable RLS on listing_match_notification_templates.
-- This table is used internally by SECURITY DEFINER database functions.

alter table if exists public.listing_match_notification_templates
  enable row level security;

-- Block direct reads/writes from client roles.
drop policy if exists listing_match_notification_templates_read_blocked
  on public.listing_match_notification_templates;
create policy listing_match_notification_templates_read_blocked
on public.listing_match_notification_templates
for select
to public
using (false);

drop policy if exists listing_match_notification_templates_write_blocked
  on public.listing_match_notification_templates;
create policy listing_match_notification_templates_write_blocked
on public.listing_match_notification_templates
for all
to public
using (false)
with check (false);
