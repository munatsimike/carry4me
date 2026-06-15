-- Re-schedule listing lifecycle cron jobs (requires pg_cron enabled in Supabase Dashboard → Database → Extensions).

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron extension is not enabled; listing lifecycle cron jobs were not scheduled.';
    return;
  end if;

  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'archive-past-trips-hourly';

  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'expire-overdue-carry-requests';

  perform cron.schedule(
    'archive-past-trips-hourly',
    '0 * * * *',
    $cron$select public.archive_past_trips();$cron$
  );

  perform cron.schedule(
    'expire-overdue-carry-requests',
    '5 * * * *',
    $cron$select public.expire_overdue_carry_requests();$cron$
  );
exception
  when others then
    raise notice 'listing lifecycle cron jobs not scheduled: %', sqlerrm;
end;
$$;
