-- Historical migration recovered from the authoritative Supabase migration log.
-- These UPE tables were later removed by 20260625160453_drop_upe_tables.sql.
create table public.upe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text not null check (char_length(description) between 1 and 500),
  tags text[] default '{}',
  lane text not null check (lane in ('intinc', 'customization', 'personal')),
  category text not null check (category in ('bug', 'feature', 'risk', 'debt', 'experiment', 'task')),
  status text not null default 'backlog' check (status in ('backlog', 'active', 'blocked', 'done', 'archived')),
  security_gate boolean default false,
  notes text default '',
  sev_impact smallint not null default 3 check (sev_impact between 0 and 5),
  sev_urgency smallint not null default 3 check (sev_urgency between 0 and 5),
  sev_frequency smallint not null default 2 check (sev_frequency between 0 and 5),
  sev_scope smallint not null default 3 check (sev_scope between 0 and 5),
  sev_confidence smallint not null default 3 check (sev_confidence between 0 and 5),
  sev_exploit_risk smallint not null default 1 check (sev_exploit_risk between 0 and 5),
  econ_value smallint not null default 3 check (econ_value between 0 and 5),
  econ_time_saved_hours numeric(6,1) not null default 2,
  econ_incidents_per_mo numeric(6,1) not null default 4,
  econ_hourly_rate numeric(6,0) not null default 120,
  econ_effort_hours numeric(7,1) not null default 8 check (econ_effort_hours >= 0.5),
  econ_ttv_days numeric(5,0) not null default 5,
  econ_risk_reduction smallint not null default 2 check (econ_risk_reduction between 0 and 5),
  wsjf_bv smallint not null default 5 check (wsjf_bv in (1,2,3,5,8,13)),
  wsjf_tc smallint not null default 5 check (wsjf_tc in (1,2,3,5,8,13)),
  wsjf_rroe smallint not null default 5 check (wsjf_rroe in (1,2,3,5,8,13)),
  wsjf_size smallint not null default 5 check (wsjf_size in (1,2,3,5,8,13)),
  history jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_upe_items_user on public.upe_items(user_id);
create index idx_upe_items_lane on public.upe_items(lane);
create index idx_upe_items_status on public.upe_items(status);

create or replace function public.upe_update_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_upe_items_updated
  before update on public.upe_items
  for each row execute function public.upe_update_timestamp();
