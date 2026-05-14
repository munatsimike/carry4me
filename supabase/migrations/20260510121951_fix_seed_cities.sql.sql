insert into public.cities (country_id, name, is_popular)
select c.id, v.name, v.is_popular
from public.countries c
join (
  values
    ('GB', 'London', true),
    ('GB', 'Birmingham', true),
    ('GB', 'Manchester', true),
    ('US', 'Houston', true),
    ('US', 'Dallas', true),
    ('US', 'Atlanta', true),
    ('ZW', 'Harare', true),
    ('ZW', 'Bulawayo', true)
) as v(country_code, name, is_popular)
on c.code = v.country_code
on conflict (country_id, name) do nothing;