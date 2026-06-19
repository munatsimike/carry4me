-- Travelers may accept any item category on a trip.
insert into public.goods_categories (slug, name)
values ('all', 'All')
on conflict (slug) do update
set name = excluded.name;

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
      from public.trip_accepted_categories tc
      inner join public.goods_categories gc_t on gc_t.id = tc.category_id
      where tc.trip_id = p_trip_id
        and lower(gc_t.slug) = 'all'
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
