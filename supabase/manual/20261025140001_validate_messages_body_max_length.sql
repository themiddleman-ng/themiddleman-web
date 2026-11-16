-- Manual only. This file lives outside supabase/migrations so `supabase db push`
-- cannot validate messages_body_max_length before the pre-flight count is 0.
-- Run by hand in the SQL editor only after supabase/preflight/2026-10-25_preflight.sql
-- shows long_message_count = 0. Do not move it back under supabase/migrations.
alter table public.messages validate constraint messages_body_max_length;
