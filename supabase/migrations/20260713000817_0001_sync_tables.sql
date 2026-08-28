-- Milestone 3 — Cloud sync of kid data (stories + gamification only; NO profile PII).
--
-- Single generic table for all synced entities. Each row is one record envelope:
-- last-write-wins by `updated_at`, with soft-delete tombstones (`deleted`).
-- `entity` discriminates the kind (stories | badges | streaks | favorites | read |
-- profileStub); `payload` is the entity data as JSON (empty object for tombstones).
--
-- COPPA posture:
--   * Row-Level Security restricts every operation to the owner (auth.uid() = user_id),
--     so one family's data is never visible to another account.
--   * `on delete cascade` from auth.users means deleting the parent's account purges
--     every synced record server-side ("account delete purges all").
--   * Only stories + gamification sync; child profile PII (name/age/avatar) never
--     leaves the device — the client syncs a minimal profile stub (id + createdAt).
--
-- Apply with: supabase db push  (or paste into the SQL editor / apply via MCP).

create table if not exists public.sync_records (
  user_id    uuid    not null references auth.users (id) on delete cascade,
  entity     text    not null,
  id         text    not null,
  updated_at bigint  not null,          -- ms epoch; the last-write-wins key
  deleted    boolean not null default false,
  payload    jsonb   not null default '{}'::jsonb,
  primary key (user_id, entity, id)
);

-- Pull path: "give me this entity's rows changed since <cursor>".
create index if not exists sync_records_pull_idx
  on public.sync_records (user_id, entity, updated_at);

alter table public.sync_records enable row level security;

-- One owner-only policy per operation (auth.uid() must equal the row's user_id).
drop policy if exists "sync_records owner select" on public.sync_records;
create policy "sync_records owner select" on public.sync_records
  for select using (auth.uid() = user_id);

drop policy if exists "sync_records owner insert" on public.sync_records;
create policy "sync_records owner insert" on public.sync_records
  for insert with check (auth.uid() = user_id);

drop policy if exists "sync_records owner update" on public.sync_records;
create policy "sync_records owner update" on public.sync_records
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sync_records owner delete" on public.sync_records;
create policy "sync_records owner delete" on public.sync_records
  for delete using (auth.uid() = user_id);
