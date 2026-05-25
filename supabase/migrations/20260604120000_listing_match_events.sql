-- Suggested-match events (step 1): record matches only.
--   listing_match_events (insert) — no notifications / email_queue yet.
--   Fired after categories are saved (category triggers) or via emit_listing_match_alerts RPC.

create table if not exists public.listing_match_events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('MATCHING_TRIP_POSTED', 'MATCHING_PARCEL_POSTED')),
  actor_user_id uuid not null references public.profiles (id) on delete cascade,
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  matched_listing_type text not null check (matched_listing_type in ('parcel', 'trip')),
  matched_listing_id uuid not null,
  source_listing_type text not null check (source_listing_type in ('parcel', 'trip')),
  source_listing_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint listing_match_events_dedup unique (type, matched_listing_id, source_listing_id)
);

create index if not exists listing_match_events_recipient_idx
  on public.listing_match_events (recipient_user_id, created_at desc);

create index if not exists listing_match_events_matched_listing_idx
  on public.listing_match_events (matched_listing_type, matched_listing_id, type);

alter table public.listing_match_events enable row level security;

drop policy if exists listing_match_events_select_party on public.listing_match_events;
create policy listing_match_events_select_party
on public.listing_match_events
for select
to authenticated
using (
  recipient_user_id = auth.uid()
  or actor_user_id = auth.uid()
);

grant select on table public.listing_match_events to authenticated;

-- Match helpers (aligned with dashboard suggestedMatches rules).

create or replace function public.canonical_listing_country(p_country text)
returns text
language sql
immutable
as $$
  select case
    when lower(trim(coalesce(p_country, ''))) in ('uk', 'gb', 'united kingdom') then 'uk'
    when lower(trim(coalesce(p_country, ''))) in ('zw', 'zimbabwe') then 'zimbabwe'
    when lower(trim(coalesce(p_country, ''))) in (
      'usa', 'us', 'united states', 'united states of america'
    ) then 'usa'
    when lower(trim(coalesce(p_country, ''))) in ('nl', 'netherlands') then 'nl'
    else lower(trim(coalesce(p_country, '')))
  end;
$$;

create or replace function public.listing_countries_match(
  a_origin_country text,
  a_destination_country text,
  b_origin_country text,
  b_destination_country text
)
returns boolean
language sql
immutable
as $$
  select
    public.canonical_listing_country(a_origin_country) =
      public.canonical_listing_country(b_origin_country)
    and public.canonical_listing_country(a_destination_country) =
      public.canonical_listing_country(b_destination_country);
$$;

create or replace function public.listing_categories_match(
  p_parcel_id uuid,
  p_trip_id uuid
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    not exists (
      select 1
      from public.parcel_categories pc
      where pc.parcel_id = p_parcel_id
    )
    or not exists (
      select 1
      from public.trip_accepted_categories tc
      where tc.trip_id = p_trip_id
    )
    or exists (
      select 1
      from public.parcel_categories pc
      inner join public.goods_categories gc_p on gc_p.id = pc.category_id
      inner join public.trip_accepted_categories tc on tc.trip_id = p_trip_id
      inner join public.goods_categories gc_t on gc_t.id = tc.category_id
      where pc.parcel_id = p_parcel_id
        and (
          lower(gc_p.id::text) = lower(gc_t.id::text)
          or lower(gc_p.slug) = lower(gc_t.slug)
          or lower(gc_p.name) = lower(gc_t.name)
        )
    );
$$;

create or replace function public.listing_weight_fits(
  p_parcel_id uuid,
  p_trip_id uuid
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    p.weight_kg <= (t.capacity_kg - t.reserved_weight_kg - t.used_weight_kg)
  from public.parcels p
  inner join public.trips t on t.id = p_trip_id
  where p.id = p_parcel_id;
$$;

create or replace function public.insert_listing_match_event(
  p_type text,
  p_actor_user_id uuid,
  p_recipient_user_id uuid,
  p_matched_listing_type text,
  p_matched_listing_id uuid,
  p_source_listing_type text,
  p_source_listing_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.listing_match_events (
    type,
    actor_user_id,
    recipient_user_id,
    matched_listing_type,
    matched_listing_id,
    source_listing_type,
    source_listing_id,
    metadata
  )
  values (
    p_type,
    p_actor_user_id,
    p_recipient_user_id,
    p_matched_listing_type,
    p_matched_listing_id,
    p_source_listing_type,
    p_source_listing_id,
    jsonb_build_object(
      'matched_listing_type', p_matched_listing_type,
      'matched_listing_id', p_matched_listing_id,
      'source_listing_type', p_source_listing_type,
      'source_listing_id', p_source_listing_id
    )
  )
  on conflict on constraint listing_match_events_dedup do nothing;
end;
$$;

create or replace function public.emit_listing_match_events_for_trip(p_trip_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip record;
  v_match record;
  v_count integer := 0;
begin
  select
    t.id,
    t.traveler_user_id,
    t.origin_country,
    t.destination_country,
    t.status
  into v_trip
  from public.trips t
  where t.id = p_trip_id;

  if not found or v_trip.status is distinct from 'ACTIVE'::public.trip_status then
    return 0;
  end if;

  for v_match in
    select
      p.id as source_listing_id,
      p.sender_user_id as recipient_user_id
    from public.parcels p
    where p.status = 'OPEN'::public.parcel_status
      and p.sender_user_id is distinct from v_trip.traveler_user_id
      and public.listing_countries_match(
        p.origin_country,
        p.destination_country,
        v_trip.origin_country,
        v_trip.destination_country
      )
      and public.listing_categories_match(p.id, v_trip.id)
      and public.listing_weight_fits(p.id, v_trip.id)
  loop
    perform public.insert_listing_match_event(
      'MATCHING_TRIP_POSTED',
      v_trip.traveler_user_id,
      v_match.recipient_user_id,
      'trip',
      v_trip.id,
      'parcel',
      v_match.source_listing_id
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.emit_listing_match_events_for_parcel(p_parcel_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parcel record;
  v_match record;
  v_count integer := 0;
begin
  select
    p.id,
    p.sender_user_id,
    p.origin_country,
    p.destination_country,
    p.status
  into v_parcel
  from public.parcels p
  where p.id = p_parcel_id;

  if not found or v_parcel.status is distinct from 'OPEN'::public.parcel_status then
    return 0;
  end if;

  for v_match in
    select
      t.id as source_listing_id,
      t.traveler_user_id as recipient_user_id
    from public.trips t
    where t.status = 'ACTIVE'::public.trip_status
      and t.traveler_user_id is distinct from v_parcel.sender_user_id
      and public.listing_countries_match(
        t.origin_country,
        t.destination_country,
        v_parcel.origin_country,
        v_parcel.destination_country
      )
      and public.listing_categories_match(v_parcel.id, t.id)
      and public.listing_weight_fits(v_parcel.id, t.id)
  loop
    perform public.insert_listing_match_event(
      'MATCHING_PARCEL_POSTED',
      v_parcel.sender_user_id,
      v_match.recipient_user_id,
      'parcel',
      v_parcel.id,
      'trip',
      v_match.source_listing_id
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- Same entry point as before (events only; no notifications).
create or replace function public.emit_listing_match_alerts(
  p_listing_type text,
  p_listing_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_events integer := 0;
  v_event_type text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_listing_type not in ('parcel', 'trip') then
    raise exception 'Invalid listing type';
  end if;

  if p_listing_type = 'trip' then
    if not exists (
      select 1
      from public.trips t
      where t.id = p_listing_id
        and t.traveler_user_id = uid
    ) then
      raise exception 'Forbidden';
    end if;

    v_event_type := 'MATCHING_TRIP_POSTED';
    v_events := public.emit_listing_match_events_for_trip(p_listing_id);
  else
    if not exists (
      select 1
      from public.parcels p
      where p.id = p_listing_id
        and p.sender_user_id = uid
    ) then
      raise exception 'Forbidden';
    end if;

    v_event_type := 'MATCHING_PARCEL_POSTED';
    v_events := public.emit_listing_match_events_for_parcel(p_listing_id);
  end if;

  return jsonb_build_object(
    'ok', true,
    'listing_type', p_listing_type,
    'listing_id', p_listing_id,
    'event_type', v_event_type,
    'events_created', v_events
  );
end;
$$;

create or replace function public.emit_listing_match_events_on_trip_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.emit_listing_match_events_for_trip(new.trip_id);
  return new;
end;
$$;

create or replace function public.emit_listing_match_events_on_parcel_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.emit_listing_match_events_for_parcel(new.parcel_id);
  return new;
end;
$$;

drop trigger if exists trip_accepted_categories_match_alerts on public.trip_accepted_categories;
create trigger trip_accepted_categories_match_alerts
  after insert on public.trip_accepted_categories
  for each row
  execute function public.emit_listing_match_events_on_trip_category();

drop trigger if exists parcel_categories_match_alerts on public.parcel_categories;
create trigger parcel_categories_match_alerts
  after insert on public.parcel_categories
  for each row
  execute function public.emit_listing_match_events_on_parcel_category();

revoke all on function public.canonical_listing_country(text) from public;
revoke all on function public.listing_countries_match(text, text, text, text) from public;
revoke all on function public.listing_categories_match(uuid, uuid) from public;
revoke all on function public.listing_weight_fits(uuid, uuid) from public;
revoke all on function public.insert_listing_match_event(
  text, uuid, uuid, text, uuid, text, uuid
) from public;
revoke all on function public.emit_listing_match_events_for_trip(uuid) from public;
revoke all on function public.emit_listing_match_events_for_parcel(uuid) from public;
revoke all on function public.emit_listing_match_alerts(text, uuid) from public;
grant execute on function public.emit_listing_match_alerts(text, uuid) to authenticated;
