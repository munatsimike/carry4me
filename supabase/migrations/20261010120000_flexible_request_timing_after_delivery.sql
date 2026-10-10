-- Flexible payment terms follow after-delivery timing on both sides.
-- Handover payout only when both listings are after-handover.
-- Persist the agreed value on the request so sender and traveler see the same steps.

create or replace function public.agreed_listing_payment_preference(
  p_parcel_pref text,
  p_trip_pref text
)
returns text
language sql
immutable
as $$
  select case
    when v_parcel = 'handover' and v_trip = 'handover' then 'handover'
    when v_parcel = 'delivery' or v_trip = 'delivery' then 'delivery'
    else 'flexible'
  end
  from (
    select
      case
        when coalesce(nullif(trim(p_parcel_pref), ''), 'flexible') in ('handover', 'delivery', 'flexible')
          then coalesce(nullif(trim(p_parcel_pref), ''), 'flexible')
        else 'flexible'
      end as v_parcel,
      case
        when coalesce(nullif(trim(p_trip_pref), ''), 'flexible') in ('handover', 'delivery', 'flexible')
          then coalesce(nullif(trim(p_trip_pref), ''), 'flexible')
        else 'flexible'
      end as v_trip
  ) prefs;
$$;

alter table public.carry_requests
  add column if not exists payment_preference text;

update public.carry_requests cr
set payment_preference = public.agreed_listing_payment_preference(
  p.payment_preference,
  t.payment_preference
)
from public.parcels p, public.trips t
where p.id = cr.parcel_id
  and t.id = cr.trip_id
  and cr.payment_preference is null;

update public.carry_requests
set payment_preference = 'flexible'
where payment_preference is null;

alter table public.carry_requests
  alter column payment_preference set default 'flexible';

alter table public.carry_requests
  alter column payment_preference set not null;

alter table public.carry_requests
  drop constraint if exists carry_requests_payment_preference_check;

alter table public.carry_requests
  add constraint carry_requests_payment_preference_check
  check (payment_preference in ('handover', 'delivery', 'flexible'));

create or replace function public.set_carry_request_payment_preference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parcel_pref text;
  v_trip_pref text;
begin
  select p.payment_preference, t.payment_preference
  into v_parcel_pref, v_trip_pref
  from public.parcels p, public.trips t
  where p.id = new.parcel_id
    and t.id = new.trip_id;

  new.payment_preference := public.agreed_listing_payment_preference(
    v_parcel_pref,
    v_trip_pref
  );

  return new;
end;
$$;

drop trigger if exists carry_requests_set_payment_preference on public.carry_requests;

create trigger carry_requests_set_payment_preference
before insert or update of parcel_id, trip_id
on public.carry_requests
for each row
execute function public.set_carry_request_payment_preference();

create or replace function public.carry_request_agreed_payment_preference(p_request_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    cr.payment_preference,
    public.agreed_listing_payment_preference(p.payment_preference, t.payment_preference)
  )
  from public.carry_requests cr
  join public.parcels p on p.id = cr.parcel_id
  join public.trips t on t.id = cr.trip_id
  where cr.id = p_request_id;
$$;

drop policy if exists parcels_carry_request_participant_read on public.parcels;
create policy parcels_carry_request_participant_read
on public.parcels
for select
to authenticated
using (
  exists (
    select 1
    from public.carry_requests cr
    where cr.parcel_id = parcels.id
      and (cr.sender_user_id = auth.uid() or cr.traveler_user_id = auth.uid())
  )
);

drop policy if exists trips_carry_request_participant_read on public.trips;
create policy trips_carry_request_participant_read
on public.trips
for select
to authenticated
using (
  exists (
    select 1
    from public.carry_requests cr
    where cr.trip_id = trips.id
      and (cr.sender_user_id = auth.uid() or cr.traveler_user_id = auth.uid())
  )
);
