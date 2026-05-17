begin;

-- The app still needs public profile card data for visible listings, but it
-- does not need every profile row to be publicly selectable. Keep column grants
-- narrow and scope row access to owners or users attached to public listings.
drop policy if exists profiles_public_card_read on public.profiles;
drop policy if exists profiles_visible_card_read on public.profiles;

create policy profiles_visible_card_read
on public.profiles
for select
to anon, authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.trips t
    where t.traveler_user_id = profiles.id
      and t.status = 'ACTIVE'
  )
  or exists (
    select 1
    from public.parcels p
    where p.sender_user_id = profiles.id
      and p.status = 'OPEN'
  )
);

-- platform_settings is internal configuration for SECURITY DEFINER RPCs.
-- The frontend does not query it directly, so remove client SELECT access.
revoke all on table public.platform_settings from anon, authenticated;

drop policy if exists platform_settings_read_authenticated on public.platform_settings;
drop policy if exists platform_settings_write_blocked on public.platform_settings;
drop policy if exists platform_settings_client_blocked on public.platform_settings;

create policy platform_settings_client_blocked
on public.platform_settings
for all
to anon, authenticated
using (false)
with check (false);

commit;
