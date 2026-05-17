begin;

-- Central account-status helpers used by policies. These are SECURITY DEFINER so
-- policies can check the signed-in user's profile without recursive profile RLS.
create or replace function public.current_account_status()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.account_status
      from public.profiles p
      where p.id = auth.uid()
    ),
    'active'
  );
$$;

create or replace function public.current_account_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_account_status() = 'active';
$$;

create or replace function public.current_account_is_not_suspended()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_account_status() <> 'suspended';
$$;

-- Own-profile RPC. The client needs full profile data for the signed-in user,
-- while public profile joins should only expose card-safe columns.
create or replace function public.get_current_profile()
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  city text,
  country_code text,
  phone_number text,
  phone_country_code text,
  phone_verified boolean,
  security_review_required boolean,
  account_status text,
  email text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.avatar_url,
    p.city,
    p.country_code,
    p.phone_number,
    p.phone_country_code,
    p.phone_verified,
    p.security_review_required,
    p.account_status,
    p.email
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.current_account_status() from public;
revoke all on function public.current_account_is_active() from public;
revoke all on function public.current_account_is_not_suspended() from public;
revoke all on function public.get_current_profile() from public;
grant execute on function public.current_account_status() to authenticated;
grant execute on function public.current_account_is_active() to authenticated;
grant execute on function public.current_account_is_not_suspended() to authenticated;
grant execute on function public.get_current_profile() to authenticated;

-- Enable RLS on all application tables that are read or mutated from the client.
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.parcels enable row level security;
alter table public.carry_requests enable row level security;
alter table public.carry_request_events enable row level security;
alter table public.carry_request_handover_confirmations enable row level security;
alter table public.notifications enable row level security;
alter table public.favourites enable row level security;
alter table public.goods_categories enable row level security;
alter table public.trip_accepted_categories enable row level security;
alter table public.parcel_categories enable row level security;
alter table public.countries enable row level security;
alter table public.cities enable row level security;
alter table public.platform_settings enable row level security;
alter table public.carry_request_notification_templates enable row level security;

-- Table privileges: expose only what the frontend should be able to call.
revoke all on table public.profiles from anon, authenticated;
grant select (id, full_name, avatar_url) on table public.profiles to anon, authenticated;
grant select (id) on table public.profiles to authenticated;
grant insert, update on table public.profiles to authenticated;

grant select on table public.trips to anon, authenticated;
grant insert, update, delete on table public.trips to authenticated;

grant select on table public.parcels to anon, authenticated;
grant insert, update, delete on table public.parcels to authenticated;

grant select, insert, update, delete on table public.carry_requests to authenticated;
grant select, insert on table public.carry_request_events to authenticated;
grant select, insert, update on table public.carry_request_handover_confirmations to authenticated;
grant select, update, delete on table public.notifications to authenticated;
grant select, insert, update, delete on table public.favourites to authenticated;

grant select on table public.goods_categories to anon, authenticated;
grant select, insert, update, delete on table public.trip_accepted_categories to authenticated;
grant select on table public.trip_accepted_categories to anon;
grant select, insert, update, delete on table public.parcel_categories to authenticated;
grant select on table public.parcel_categories to anon;

grant select on table public.countries to anon, authenticated;
grant select on table public.cities to anon, authenticated;
grant select on table public.platform_settings to authenticated;

-- profiles
drop policy if exists "users can read own profile" on public.profiles;
drop policy if exists "users can insert own profile" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;
drop policy if exists "profiles viewable by anon (public card fields)" on public.profiles;
drop policy if exists profiles_public_card_read on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_delete_blocked on public.profiles;

create policy profiles_public_card_read
on public.profiles
for select
to anon, authenticated
using (true);

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid() and public.current_account_is_not_suspended())
with check (id = auth.uid() and public.current_account_is_not_suspended());

create policy profiles_delete_blocked
on public.profiles
for delete
to authenticated
using (false);

-- trips
drop policy if exists "anyone can read trips" on public.trips;
drop policy if exists "users can create own trips" on public.trips;
drop policy if exists "users can update own trips" on public.trips;
drop policy if exists "users can delete own trips" on public.trips;
drop policy if exists trips_public_read_active_or_owner on public.trips;
drop policy if exists trips_insert_active_owner on public.trips;
drop policy if exists trips_update_active_owner on public.trips;
drop policy if exists trips_delete_active_owner on public.trips;

create policy trips_public_read_active_or_owner
on public.trips
for select
to anon, authenticated
using (
  status = 'ACTIVE'
  or traveler_user_id = auth.uid()
);

create policy trips_insert_active_owner
on public.trips
for insert
to authenticated
with check (
  traveler_user_id = auth.uid()
  and public.current_account_is_active()
);

create policy trips_update_active_owner
on public.trips
for update
to authenticated
using (
  traveler_user_id = auth.uid()
  and public.current_account_is_active()
)
with check (
  traveler_user_id = auth.uid()
  and public.current_account_is_active()
);

create policy trips_delete_active_owner
on public.trips
for delete
to authenticated
using (
  traveler_user_id = auth.uid()
  and public.current_account_is_active()
);

-- parcels
drop policy if exists "anyone can read parcels" on public.parcels;
drop policy if exists "users can create own parcels" on public.parcels;
drop policy if exists "users can update own parcels" on public.parcels;
drop policy if exists "users can delete own parcels" on public.parcels;
drop policy if exists parcels_public_read_open_or_owner on public.parcels;
drop policy if exists parcels_insert_active_owner on public.parcels;
drop policy if exists parcels_update_active_owner on public.parcels;
drop policy if exists parcels_delete_active_owner on public.parcels;

create policy parcels_public_read_open_or_owner
on public.parcels
for select
to anon, authenticated
using (
  status = 'OPEN'
  or sender_user_id = auth.uid()
);

create policy parcels_insert_active_owner
on public.parcels
for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and public.current_account_is_active()
);

create policy parcels_update_active_owner
on public.parcels
for update
to authenticated
using (
  sender_user_id = auth.uid()
  and public.current_account_is_active()
)
with check (
  sender_user_id = auth.uid()
  and public.current_account_is_active()
);

create policy parcels_delete_active_owner
on public.parcels
for delete
to authenticated
using (
  sender_user_id = auth.uid()
  and public.current_account_is_active()
);

-- carry_requests
drop policy if exists "users can read own carry requests" on public.carry_requests;
drop policy if exists "sender can create carry requests" on public.carry_requests;
drop policy if exists "traveler can create carry requests" on public.carry_requests;
drop policy if exists "parties can update carry requests" on public.carry_requests;
drop policy if exists carry_requests_select_participant on public.carry_requests;
drop policy if exists carry_requests_insert_active_initiator on public.carry_requests;
drop policy if exists carry_requests_update_participant_not_suspended on public.carry_requests;
drop policy if exists carry_requests_delete_blocked on public.carry_requests;

create policy carry_requests_select_participant
on public.carry_requests
for select
to authenticated
using (
  sender_user_id = auth.uid()
  or traveler_user_id = auth.uid()
);

create policy carry_requests_insert_active_initiator
on public.carry_requests
for insert
to authenticated
with check (
  public.current_account_is_active()
  and sender_user_id <> traveler_user_id
  and (
    (
      initiator_role::text = 'SENDER'
      and sender_user_id = auth.uid()
      and exists (
        select 1
        from public.parcels p
        where p.id = parcel_id
          and p.sender_user_id = auth.uid()
          and p.status = 'OPEN'
      )
      and exists (
        select 1
        from public.trips t
        where t.id = trip_id
          and t.traveler_user_id = traveler_user_id
          and t.status = 'ACTIVE'
      )
    )
    or
    (
      initiator_role::text = 'TRAVELER'
      and traveler_user_id = auth.uid()
      and exists (
        select 1
        from public.trips t
        where t.id = trip_id
          and t.traveler_user_id = auth.uid()
          and t.status = 'ACTIVE'
      )
      and exists (
        select 1
        from public.parcels p
        where p.id = parcel_id
          and p.sender_user_id = sender_user_id
          and p.status = 'OPEN'
      )
    )
  )
);

create policy carry_requests_update_participant_not_suspended
on public.carry_requests
for update
to authenticated
using (
  public.current_account_is_not_suspended()
  and (
    sender_user_id = auth.uid()
    or traveler_user_id = auth.uid()
  )
)
with check (
  public.current_account_is_not_suspended()
  and (
    sender_user_id = auth.uid()
    or traveler_user_id = auth.uid()
  )
);

create policy carry_requests_delete_blocked
on public.carry_requests
for delete
to authenticated
using (false);

-- carry_request_events
drop policy if exists carry_request_events_select_participant on public.carry_request_events;
drop policy if exists carry_request_events_insert_participant on public.carry_request_events;
drop policy if exists carry_request_events_update_blocked on public.carry_request_events;
drop policy if exists carry_request_events_delete_blocked on public.carry_request_events;

create policy carry_request_events_select_participant
on public.carry_request_events
for select
to authenticated
using (
  exists (
    select 1
    from public.carry_requests cr
    where cr.id = carry_request_id
      and (cr.sender_user_id = auth.uid() or cr.traveler_user_id = auth.uid())
  )
);

create policy carry_request_events_insert_participant
on public.carry_request_events
for insert
to authenticated
with check (
  public.current_account_is_not_suspended()
  and actor_user_id = auth.uid()
  and exists (
    select 1
    from public.carry_requests cr
    where cr.id = carry_request_id
      and (cr.sender_user_id = auth.uid() or cr.traveler_user_id = auth.uid())
  )
);

create policy carry_request_events_update_blocked
on public.carry_request_events
for update
to authenticated
using (false)
with check (false);

create policy carry_request_events_delete_blocked
on public.carry_request_events
for delete
to authenticated
using (false);

-- carry_request_handover_confirmations
drop policy if exists handover_confirmations_select_participant on public.carry_request_handover_confirmations;
drop policy if exists handover_confirmations_insert_participant on public.carry_request_handover_confirmations;
drop policy if exists handover_confirmations_update_participant on public.carry_request_handover_confirmations;
drop policy if exists handover_confirmations_delete_blocked on public.carry_request_handover_confirmations;

create policy handover_confirmations_select_participant
on public.carry_request_handover_confirmations
for select
to authenticated
using (
  exists (
    select 1
    from public.carry_requests cr
    where cr.id = carry_request_id
      and (cr.sender_user_id = auth.uid() or cr.traveler_user_id = auth.uid())
  )
);

create policy handover_confirmations_insert_participant
on public.carry_request_handover_confirmations
for insert
to authenticated
with check (
  public.current_account_is_not_suspended()
  and user_id = auth.uid()
  and exists (
    select 1
    from public.carry_requests cr
    where cr.id = carry_request_id
      and (cr.sender_user_id = auth.uid() or cr.traveler_user_id = auth.uid())
  )
);

create policy handover_confirmations_update_participant
on public.carry_request_handover_confirmations
for update
to authenticated
using (
  public.current_account_is_not_suspended()
  and user_id = auth.uid()
)
with check (
  public.current_account_is_not_suspended()
  and user_id = auth.uid()
);

create policy handover_confirmations_delete_blocked
on public.carry_request_handover_confirmations
for delete
to authenticated
using (false);

-- notifications
drop policy if exists notifications_select_own on public.notifications;
drop policy if exists notifications_insert_blocked on public.notifications;
drop policy if exists notifications_update_own on public.notifications;
drop policy if exists notifications_delete_own on public.notifications;

create policy notifications_select_own
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

create policy notifications_insert_blocked
on public.notifications
for insert
to authenticated
with check (false);

create policy notifications_update_own
on public.notifications
for update
to authenticated
using (user_id = auth.uid() and public.current_account_is_not_suspended())
with check (user_id = auth.uid() and public.current_account_is_not_suspended());

create policy notifications_delete_own
on public.notifications
for delete
to authenticated
using (user_id = auth.uid() and public.current_account_is_not_suspended());

-- favourites
drop policy if exists favourites_select_own on public.favourites;
drop policy if exists favourites_insert_own on public.favourites;
drop policy if exists favourites_update_own on public.favourites;
drop policy if exists favourites_delete_own on public.favourites;

create policy favourites_select_own
on public.favourites
for select
to authenticated
using (user_id = auth.uid());

create policy favourites_insert_own
on public.favourites
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.current_account_is_not_suspended()
);

create policy favourites_update_own
on public.favourites
for update
to authenticated
using (
  user_id = auth.uid()
  and public.current_account_is_not_suspended()
)
with check (
  user_id = auth.uid()
  and public.current_account_is_not_suspended()
);

create policy favourites_delete_own
on public.favourites
for delete
to authenticated
using (
  user_id = auth.uid()
  and public.current_account_is_not_suspended()
);

-- lookup tables
drop policy if exists "categories_read_all" on public.goods_categories;
drop policy if exists goods_categories_read_active on public.goods_categories;
drop policy if exists goods_categories_write_blocked on public.goods_categories;
drop policy if exists countries_read_active on public.countries;
drop policy if exists countries_write_blocked on public.countries;
drop policy if exists cities_read_active on public.cities;
drop policy if exists cities_write_blocked on public.cities;

create policy goods_categories_read_active
on public.goods_categories
for select
to anon, authenticated
using (true);

create policy goods_categories_write_blocked
on public.goods_categories
for all
to authenticated
using (false)
with check (false);

create policy countries_read_active
on public.countries
for select
to anon, authenticated
using (is_active = true);

create policy countries_write_blocked
on public.countries
for all
to authenticated
using (false)
with check (false);

create policy cities_read_active
on public.cities
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.countries c
    where c.id = country_id
      and c.is_active = true
  )
);

create policy cities_write_blocked
on public.cities
for all
to authenticated
using (false)
with check (false);

-- listing category join tables
drop policy if exists parcel_categories_read_authenticated on public.parcel_categories;
drop policy if exists pc_read_owner on public.parcel_categories;
drop policy if exists pc_insert_owner on public.parcel_categories;
drop policy if exists pc_update_owner on public.parcel_categories;
drop policy if exists pc_delete_owner on public.parcel_categories;
drop policy if exists parcel_categories_read_public_open_or_owner on public.parcel_categories;
drop policy if exists parcel_categories_insert_active_owner on public.parcel_categories;
drop policy if exists parcel_categories_update_active_owner on public.parcel_categories;
drop policy if exists parcel_categories_delete_active_owner on public.parcel_categories;

create policy parcel_categories_read_public_open_or_owner
on public.parcel_categories
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.parcels p
    where p.id = parcel_id
      and (p.status = 'OPEN' or p.sender_user_id = auth.uid())
  )
);

create policy parcel_categories_insert_active_owner
on public.parcel_categories
for insert
to authenticated
with check (
  public.current_account_is_active()
  and exists (
    select 1
    from public.parcels p
    where p.id = parcel_id
      and p.sender_user_id = auth.uid()
  )
);

create policy parcel_categories_update_active_owner
on public.parcel_categories
for update
to authenticated
using (
  public.current_account_is_active()
  and exists (
    select 1
    from public.parcels p
    where p.id = parcel_id
      and p.sender_user_id = auth.uid()
  )
)
with check (
  public.current_account_is_active()
  and exists (
    select 1
    from public.parcels p
    where p.id = parcel_id
      and p.sender_user_id = auth.uid()
  )
);

create policy parcel_categories_delete_active_owner
on public.parcel_categories
for delete
to authenticated
using (
  public.current_account_is_active()
  and exists (
    select 1
    from public.parcels p
    where p.id = parcel_id
      and p.sender_user_id = auth.uid()
  )
);

drop policy if exists tac_read_all on public.trip_accepted_categories;
drop policy if exists tac_insert_owner on public.trip_accepted_categories;
drop policy if exists tac_update_owner on public.trip_accepted_categories;
drop policy if exists tac_delete_owner on public.trip_accepted_categories;
drop policy if exists trip_accepted_categories_read_public_active_or_owner on public.trip_accepted_categories;
drop policy if exists trip_accepted_categories_insert_active_owner on public.trip_accepted_categories;
drop policy if exists trip_accepted_categories_update_active_owner on public.trip_accepted_categories;
drop policy if exists trip_accepted_categories_delete_active_owner on public.trip_accepted_categories;

create policy trip_accepted_categories_read_public_active_or_owner
on public.trip_accepted_categories
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_id
      and (t.status = 'ACTIVE' or t.traveler_user_id = auth.uid())
  )
);

create policy trip_accepted_categories_insert_active_owner
on public.trip_accepted_categories
for insert
to authenticated
with check (
  public.current_account_is_active()
  and exists (
    select 1
    from public.trips t
    where t.id = trip_id
      and t.traveler_user_id = auth.uid()
  )
);

create policy trip_accepted_categories_update_active_owner
on public.trip_accepted_categories
for update
to authenticated
using (
  public.current_account_is_active()
  and exists (
    select 1
    from public.trips t
    where t.id = trip_id
      and t.traveler_user_id = auth.uid()
  )
)
with check (
  public.current_account_is_active()
  and exists (
    select 1
    from public.trips t
    where t.id = trip_id
      and t.traveler_user_id = auth.uid()
  )
);

create policy trip_accepted_categories_delete_active_owner
on public.trip_accepted_categories
for delete
to authenticated
using (
  public.current_account_is_active()
  and exists (
    select 1
    from public.trips t
    where t.id = trip_id
      and t.traveler_user_id = auth.uid()
  )
);

-- Internal configuration/template tables.
drop policy if exists platform_settings_read_authenticated on public.platform_settings;
drop policy if exists platform_settings_write_blocked on public.platform_settings;
drop policy if exists carry_request_notification_templates_read_blocked on public.carry_request_notification_templates;
drop policy if exists carry_request_notification_templates_write_blocked on public.carry_request_notification_templates;

create policy platform_settings_read_authenticated
on public.platform_settings
for select
to authenticated
using (true);

create policy platform_settings_write_blocked
on public.platform_settings
for all
to authenticated
using (false)
with check (false);

create policy carry_request_notification_templates_read_blocked
on public.carry_request_notification_templates
for select
to authenticated
using (false);

create policy carry_request_notification_templates_write_blocked
on public.carry_request_notification_templates
for all
to authenticated
using (false)
with check (false);

commit;
