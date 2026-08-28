-- Historical cleanup migration recovered from the authoritative Supabase log.
drop table if exists public.upe_webhooks cascade;
drop table if exists public.upe_api_keys cascade;
drop table if exists public.upe_settings cascade;
drop table if exists public.upe_items cascade;
