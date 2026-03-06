-- Enable RLS
alter table public.parcel_categories enable row level security;

-- Allow public read
create policy "parcel_categories_public_read"
on public.parcel_categories
for select
to anon, authenticated
using (true);