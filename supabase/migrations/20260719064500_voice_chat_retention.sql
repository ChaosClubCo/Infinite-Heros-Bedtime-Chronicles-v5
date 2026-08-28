-- Voice Chat storage and transcript retention hard cap.
--
-- The application stores private parent-owned conversation metadata and sanitized
-- text transcripts in PostgreSQL. These tables are server-only: RLS is enabled,
-- no client policies are granted, and anon/authenticated roles are explicitly
-- denied direct table access. The backend reaches them through DATABASE_URL.
--
-- Runtime cleanup applies the configured 1-30 day retention window before any
-- transcript is read or reused. The pg_cron job is an independent 30-day backstop
-- for inactive accounts that never make another request.

create table if not exists public.conversations (
  id serial primary key,
  user_id text not null default 'anonymous',
  title text not null,
  created_at timestamp not null default now()
);

create table if not exists public.messages (
  id serial primary key,
  conversation_id integer not null references public.conversations(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamp not null default now()
);

create index if not exists conversations_user_created_idx
  on public.conversations (user_id, created_at desc);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

create index if not exists messages_created_at_retention_idx
  on public.messages (created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on table public.conversations from anon, authenticated;
revoke all on table public.messages from anon, authenticated;
revoke all on sequence public.conversations_id_seq from anon, authenticated;
revoke all on sequence public.messages_id_seq from anon, authenticated;

create extension if not exists pg_cron with schema extensions;

-- Re-running the migration should replace, not duplicate, the named job.
do $$
declare
  existing_job_id bigint;
begin
  select jobid
    into existing_job_id
    from cron.job
   where jobname = 'purge-expired-voice-chat-transcripts'
   order by jobid desc
   limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end
$$;

select cron.schedule(
  'purge-expired-voice-chat-transcripts',
  '17 3 * * *',
  $$delete from public.messages where created_at < now() - interval '30 days'$$
);
