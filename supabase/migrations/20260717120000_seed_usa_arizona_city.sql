-- Add Arizona as a USA origin city option.
insert into public.cities (country_id, name, is_popular)
select c.id, v.name, v.is_popular
from public.countries c
join (
  values
    ('USA', 'Arizona', true)
) as v(country_code, name, is_popular)
on c.code = v.country_code
on conflict (country_id, name) do nothing;
