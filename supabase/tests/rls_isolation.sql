-- Transactional live RLS isolation probe.
--
-- Run only against a disposable Supabase preview branch:
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_isolation.sql
--
-- The probe creates two synthetic parents and rows, switches to the same
-- authenticated role used by Supabase clients, proves User A cannot read or
-- mutate User B data, confirms chat tables deny direct client access, and rolls
-- back every synthetic row.

begin;

insert into auth.users (
  id, aud, role, email, encrypted_password, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) values
  ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated',
   'rls-a@example.invalid', '', now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
  ('00000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated',
   'rls-b@example.invalid', '', now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb);

insert into public.sync_records (user_id, entity, id, updated_at, deleted, payload) values
  ('00000000-0000-4000-8000-0000000000a1', 'stories', 'probe-a', 1, false, '{"owner":"a"}'::jsonb),
  ('00000000-0000-4000-8000-0000000000b2', 'stories', 'probe-b', 1, false, '{"owner":"b"}'::jsonb);

insert into public.conversations (user_id, title)
values ('00000000-0000-4000-8000-0000000000b2', 'private probe');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}',
  true
);

do $probe$
declare
  visible_count integer;
  affected_count integer;
  blocked_insert boolean := false;
  chat_select_blocked boolean := false;
  message_select_blocked boolean := false;
begin
  select count(*) into visible_count from public.sync_records;
  if visible_count <> 1 then
    raise exception 'RLS SELECT isolation failed: expected 1 visible row, got %', visible_count;
  end if;

  if not exists (
    select 1 from public.sync_records
    where user_id = '00000000-0000-4000-8000-0000000000a1' and id = 'probe-a'
  ) then
    raise exception 'RLS SELECT ownership failed: user A cannot see own row';
  end if;

  update public.sync_records set payload = '{"tampered":true}'::jsonb
  where user_id = '00000000-0000-4000-8000-0000000000b2';
  get diagnostics affected_count = row_count;
  if affected_count <> 0 then
    raise exception 'RLS UPDATE isolation failed: user A updated % user B rows', affected_count;
  end if;

  delete from public.sync_records
  where user_id = '00000000-0000-4000-8000-0000000000b2';
  get diagnostics affected_count = row_count;
  if affected_count <> 0 then
    raise exception 'RLS DELETE isolation failed: user A deleted % user B rows', affected_count;
  end if;

  begin
    insert into public.sync_records (user_id, entity, id, updated_at, deleted, payload)
    values ('00000000-0000-4000-8000-0000000000b2', 'stories', 'forged-by-a', 2, false, '{}'::jsonb);
  exception when insufficient_privilege then
    blocked_insert := true;
  end;
  if not blocked_insert then
    raise exception 'RLS INSERT isolation failed: user A forged a user B row';
  end if;

  insert into public.sync_records (user_id, entity, id, updated_at, deleted, payload)
  values ('00000000-0000-4000-8000-0000000000a1', 'stories', 'own-insert', 2, false, '{}'::jsonb);

  begin
    perform count(*) from public.conversations;
  exception when insufficient_privilege then
    chat_select_blocked := true;
  end;
  if not chat_select_blocked then
    raise exception 'Conversation deny-by-default failed';
  end if;

  begin
    perform count(*) from public.messages;
  exception when insufficient_privilege then
    message_select_blocked := true;
  end;
  if not message_select_blocked then
    raise exception 'Message deny-by-default failed';
  end if;
end
$probe$;

reset role;
rollback;

select
  'PASS'::text as result,
  'A owns only A rows; B select/update/delete/insert denied; chat tables deny direct authenticated access; all probe data rolled back.'::text as evidence;
