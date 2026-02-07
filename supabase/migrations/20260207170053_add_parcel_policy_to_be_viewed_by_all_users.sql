create policy "parcel_categories_read_authenticated"
on public.parcel_categories
for select
to authenticated
using (true);
