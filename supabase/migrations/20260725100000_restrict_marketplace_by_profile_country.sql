-- Restrict marketplace browse (ACTIVE trips / OPEN parcels) to the viewer's
-- profile country for ordinary accounts. Admins keep global visibility.
-- Owners always see their own listings. Anonymous browse stays global.

begin;

create or replace function public.current_profile_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.profile_type
      from public.profiles p
      where p.id = auth.uid()
    ),
    'ordinary'
  ) = 'admin';
$$;

create or replace function public.current_profile_canonical_country()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nullif(
    public.canonical_listing_country(
      (
        select coalesce(
          nullif(trim(p.country_code), ''),
          nullif(trim(p.country), '')
        )
        from public.profiles p
        where p.id = auth.uid()
      )
    ),
    ''
  );
$$;

-- True when the signed-in viewer may see a public marketplace listing
-- with the given origin country.
create or replace function public.marketplace_origin_visible_to_viewer(
  p_origin_country text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- Pre-login discovery keeps the previous global browse behaviour.
    auth.uid() is null
    or public.current_profile_is_admin()
    or (
      public.current_profile_canonical_country() is not null
      and public.canonical_listing_country(p_origin_country)
        = public.current_profile_canonical_country()
    );
$$;

revoke all on function public.current_profile_is_admin() from public;
revoke all on function public.current_profile_canonical_country() from public;
revoke all on function public.marketplace_origin_visible_to_viewer(text) from public;

grant execute on function public.current_profile_is_admin() to authenticated;
grant execute on function public.current_profile_canonical_country() to authenticated;
grant execute on function public.marketplace_origin_visible_to_viewer(text) to anon, authenticated;

drop policy if exists trips_public_read_active_or_owner on public.trips;

create policy trips_public_read_active_or_owner
on public.trips
for select
to anon, authenticated
using (
  traveler_user_id = auth.uid()
  or (
    status = 'ACTIVE'
    and public.marketplace_origin_visible_to_viewer(origin_country)
  )
);

drop policy if exists parcels_public_read_open_or_owner on public.parcels;

create policy parcels_public_read_open_or_owner
on public.parcels
for select
to anon, authenticated
using (
  sender_user_id = auth.uid()
  or (
    status = 'OPEN'
    and public.marketplace_origin_visible_to_viewer(origin_country)
  )
);

commit;
