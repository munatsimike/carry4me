alter table public.profiles
  drop column if exists phone_country_code;

alter table public.profiles
  drop column if exists security_review_required;