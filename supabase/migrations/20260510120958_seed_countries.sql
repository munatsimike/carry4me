insert into public.countries (name, code)
values
  ('United States', 'US'),
  ('United Kingdom', 'GB')
on conflict (code) do nothing;