-- Voice Chat transcript retention hard cap.
--
-- Runtime cleanup applies the configured retention window before any transcript
-- is read or reused. This database job is the independent backstop for inactive
-- accounts that never open Voice Chat again: message rows cannot remain beyond
-- 30 days merely because no request arrived to trigger application cleanup.
--
-- Supabase exposes pg_cron in the `extensions` schema. Apply through the normal
-- migration pipeline with a database role allowed to create extensions/jobs.

create extension if not exists pg_cron with schema extensions;

create index if not exists messages_created_at_retention_idx
  on public.messages (created_at);

-- Re-running the migration should replace, not duplicate, the named job.
do $$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'purge-expired-voice-chat-transcripts';
exception
  when undefined_table or invalid_schema_name or insufficient_privilege then
    -- The explicit schedule call below still fails the migration if pg_cron is
    -- unavailable; this block only makes replacement idempotent.
    null;
end
$$;

select cron.schedule(
  'purge-expired-voice-chat-transcripts',
  '17 3 * * *',
  $$delete from public.messages where created_at < now() - interval '30 days'$$
);
