-- Historical application migration recovered from the authoritative Supabase log.
create table if not exists public.users (
  id varchar primary key default gen_random_uuid(),
  username text not null unique
);

create table if not exists public.conversations (
  id serial primary key,
  user_id text not null default 'anonymous',
  title text not null,
  created_at timestamp not null default current_timestamp
);

create table if not exists public.messages (
  id serial primary key,
  conversation_id integer not null references public.conversations(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamp not null default current_timestamp
);

create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_conversations_created_at on public.conversations(created_at desc);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
