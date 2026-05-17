alter table profiles
add column email text;

alter table profiles
add constraint profiles_email_unique unique (email);