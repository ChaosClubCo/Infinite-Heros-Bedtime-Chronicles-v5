-- Historical migration recovered from the authoritative Supabase migration log.
-- The tables were removed by 20260625160453_drop_upe_tables.sql.
create table public.upe_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null unique,
  label text default 'Default',
  active boolean default true,
  created_at timestamptz not null default now()
);

create index idx_upe_api_keys_user on public.upe_api_keys(user_id);
create index idx_upe_api_keys_key on public.upe_api_keys(key);

create table public.upe_webhooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  events text[] default '{item.created,item.updated,item.deleted,item.status_changed}',
  secret text,
  active boolean default true,
  created_at timestamptz not null default now()
);

create index idx_upe_webhooks_user on public.upe_webhooks(user_id);

alter table public.upe_api_keys enable row level security;
alter table public.upe_webhooks enable row level security;

create policy "Users manage own API keys"
  on public.upe_api_keys for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own webhooks"
  on public.upe_webhooks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
