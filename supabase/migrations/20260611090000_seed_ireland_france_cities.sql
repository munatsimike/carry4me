insert into public.countries (name, code)
values
  ('Ireland', 'IE'),
  ('France', 'FR')
on conflict (code) do nothing;

insert into public.cities (country_id, name, is_popular)
select c.id, v.name, v.is_popular
from public.countries c
join (
  values
    ('IE', 'Dublin', true),
    ('FR', 'Paris', true),
    ('FR', 'Melhouse', true)
) as v(country_code, name, is_popular)
on c.code = v.country_code
on conflict (country_id, name) do nothing;
