-- 2026xxxxxx_make_profiles_public_basic.sql
-- Goal:
-- - Allow NOT logged in users (role: anon) to view profile cards
-- - But only expose safe columns (id, username, avatar_url)
-- - Keep RLS enabled

begin;

-- 1) Ensure RLS is enabled
alter table public.profiles enable row level security;

-- 2) Policy: allow anon to SELECT rows (RLS-level)
-- If you already have a "authenticated can view" policy, keep it.
-- This adds a separate anon policy.
drop policy if exists "profiles viewable by anon (public card fields)" on public.profiles;

create policy "profiles viewable by anon (public card fields)"
on public.profiles
for select
to anon
using (true);

-- 3) IMPORTANT: restrict anon to safe columns only (column-level privileges)
-- Revoke any existing SELECT privileges from anon, then grant only the columns you want public.
revoke all on table public.profiles from anon;

-- Pick the columns you want public for cards:
-- Add/remove columns here as needed (e.g. country, rating, bio_short)
grant select (id, full_name, avatar_url) on table public.profiles to anon;

-- 4) Make sure authenticated still has SELECT privilege
-- (RLS still controls what rows they can see)
grant select on table public.profiles to authenticated;

commit;
