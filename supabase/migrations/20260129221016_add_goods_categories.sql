-- 1) Categories table
create table if not exists public.goods_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- Helpful indexes (optional but recommended)
create index if not exists goods_categories_slug_idx
  on public.goods_categories (slug);

-- 2) Trip ↔ categories (accepted goods)
create table if not exists public.trip_accepted_categories (
  trip_id uuid not null references public.trips(id) on delete cascade,
  category_id uuid not null references public.goods_categories(id) on delete restrict,
  primary key (trip_id, category_id)
);

create index if not exists trip_accepted_categories_trip_id_idx
  on public.trip_accepted_categories (trip_id);

create index if not exists trip_accepted_categories_category_id_idx
  on public.trip_accepted_categories (category_id);

-- 3) Parcel ↔ categories (what parcel contains)
create table if not exists public.parcel_categories (
  parcel_id uuid not null references public.parcels(id) on delete cascade,
  category_id uuid not null references public.goods_categories(id) on delete restrict,
  primary key (parcel_id, category_id)
);

create index if not exists parcel_categories_parcel_id_idx
  on public.parcel_categories (parcel_id);

create index if not exists parcel_categories_category_id_idx
  on public.parcel_categories (category_id);
