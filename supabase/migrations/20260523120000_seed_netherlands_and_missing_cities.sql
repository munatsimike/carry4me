-- Netherlands (+31) and Zimbabwe were supported in the app but never seeded with cities.
insert into public.countries (name, code)
values
  ('Netherlands', 'NL'),
  ('Zimbabwe', 'ZW')
on conflict (code) do nothing;

insert into public.cities (country_id, name, is_popular)
select c.id, v.name, v.is_popular
from public.countries c
join (
  values
    ('NL', 'Amsterdam', true),
    ('NL', 'Rotterdam', true),
    ('NL', 'The Hague', true),
    ('NL', 'Utrecht', true),
    ('NL', 'Eindhoven', true),
    ('ZW', 'Harare', true),
    ('ZW', 'Bulawayo', true)
) as v(country_code, name, is_popular)
on c.code = v.country_code
on conflict (country_id, name) do nothing;
