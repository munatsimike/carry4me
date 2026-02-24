-- 1) confirm RLS status (t = enabled)
select relrowsecurity
from pg_class
where relname = 'objects'
  and relnamespace = 'storage'::regnamespace;

-- 2) confirm policies exist
select policyname, cmd, roles
from pg_policies
where schemaname='storage' and tablename='objects'
order by policyname;