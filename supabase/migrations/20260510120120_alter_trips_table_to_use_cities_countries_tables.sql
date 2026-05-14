-- Add normalized country/city references to trips

alter table public.trips
add column origin_country_id uuid
references public.countries(id),

add column origin_city_id uuid
references public.cities(id),

add column origin_custom_city text,

add column destination_country_id uuid
references public.countries(id),

add column destination_city_id uuid
references public.cities(id),

add column destination_custom_city text;

-- Optional indexes

create index trips_origin_country_id_idx
on public.trips(origin_country_id);

create index trips_origin_city_id_idx
on public.trips(origin_city_id);

create index trips_destination_country_id_idx
on public.trips(destination_country_id);

create index trips_destination_city_id_idx
on public.trips(destination_city_id);