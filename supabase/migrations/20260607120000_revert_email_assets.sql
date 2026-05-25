-- Remove email icon storage access (icons feature reverted).
-- Bucket/objects can be removed via Supabase Storage UI if desired.

drop policy if exists "Public read email assets" on storage.objects;

update storage.buckets
set public = false
where id = 'email-assets';
