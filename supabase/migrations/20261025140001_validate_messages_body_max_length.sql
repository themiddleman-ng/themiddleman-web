-- Run only after pre-flight confirms zero messages longer than 3000 characters
-- (see supabase/preflight/2026-10-25_preflight.sql).
alter table public.messages validate constraint messages_body_max_length;
