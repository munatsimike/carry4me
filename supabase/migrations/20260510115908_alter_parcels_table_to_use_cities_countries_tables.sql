-- Add normalized country/city references to parcels

alter table public.parcels
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

-- Optional indexes for filtering/searching

create index parcels_origin_country_id_idx
on public.parcels(origin_country_id);

create index parcels_origin_city_id_idx
on public.parcels(origin_city_id);

create index parcels_destination_country_id_idx
on public.parcels(destination_country_id);

create index parcels_destination_city_id_idx
on public.parcels(destination_city_id);