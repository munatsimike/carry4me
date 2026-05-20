-- Track when origin_city was entered manually instead of chosen from approved cities.

alter table public.parcels
  add column if not exists origin_city_is_custom boolean not null default false;

alter table public.trips
  add column if not exists origin_city_is_custom boolean not null default false;

comment on column public.parcels.origin_city_is_custom is
  'True when origin_city is a user-typed city (Other), not from the cities catalog.';

comment on column public.trips.origin_city_is_custom is
  'True when origin_city is a user-typed city (Other), not from the cities catalog.';
