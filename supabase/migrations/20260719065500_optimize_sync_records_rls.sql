-- Scope sync_records client access to authenticated users and evaluate auth.uid()
-- once per statement rather than once per candidate row. Service-role/database
-- access continues to bypass RLS for server-orchestrated deletion and maintenance.
drop policy if exists "sync_records owner select" on public.sync_records;
create policy "sync_records owner select" on public.sync_records
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "sync_records owner insert" on public.sync_records;
create policy "sync_records owner insert" on public.sync_records
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "sync_records owner update" on public.sync_records;
create policy "sync_records owner update" on public.sync_records
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "sync_records owner delete" on public.sync_records;
create policy "sync_records owner delete" on public.sync_records
  for delete to authenticated
  using ((select auth.uid()) = user_id);
