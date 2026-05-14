create table public.cities (
  id uuid primary key default gen_random_uuid(),

  country_id uuid not null
  references public.countries(id)
  on delete cascade,

  name text not null,
  is_popular boolean not null default false,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  unique(country_id, name)
);

create index cities_country_id_idx
on public.cities(country_id);

create index cities_is_popular_idx
on public.cities(is_popular);