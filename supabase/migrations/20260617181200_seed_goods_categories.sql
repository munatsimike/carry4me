-- Seed initial goods categories.
-- Safe to re-run: upserts by slug.

insert into public.goods_categories (slug, name)
values
  ('documents', 'Documents'),
  ('clothes', 'Clothes'),
  ('shoes', 'Shoes'),
  ('electronics', 'Electronics'),
  ('beauty-perfumes', 'Beauty & Perfumes'),
  ('bags-accessories', 'Bags & Accessories'),
  ('household-items', 'Household Items'),
  ('other', 'Other')
on conflict (slug) do update
set name = excluded.name;

