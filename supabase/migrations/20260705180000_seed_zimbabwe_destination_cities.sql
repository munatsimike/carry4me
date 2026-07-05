-- Zimbabwe destination cities used in parcel/trip forms.
insert into public.cities (country_id, name, is_popular)
select c.id, v.name, v.is_popular
from public.countries c
join (
  values
    ('ZW', 'Mutare', true),
    ('ZW', 'Gweru', true),
    ('ZW', 'Masvingo', true)
) as v(country_code, name, is_popular)
  on c.code = v.country_code
on conflict (country_id, name) do nothing;
