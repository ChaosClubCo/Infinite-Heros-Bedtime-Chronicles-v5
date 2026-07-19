-- Historical migration recovered from the authoritative Supabase migration log.
create table public.upe_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_lane text default 'personal',
  default_hourly_rate numeric(6,0) default 120,
  default_sort text default 'priority_desc',
  stale_threshold integer default 14,
  decay_threshold integer default 30,
  theme text default 'dark',
  updated_at timestamptz default now()
);

alter table public.upe_items enable row level security;
alter table public.upe_settings enable row level security;

create policy "Users manage own items"
  on public.upe_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own settings"
  on public.upe_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
