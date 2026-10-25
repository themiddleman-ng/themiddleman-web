-- pgTAP / manual RLS checks for public_seller_profiles (run on local Supabase only).
-- Untested in CI until `supabase start` is available in the agent environment.

begin;

-- Expect: anon cannot read pending seller rows from seller_profiles.
-- select id from public.seller_profiles where verification_status = 'pending'; -- should return 0 rows as anon

-- Expect: anon can read approved seller via the directory view.
-- select id, display_name from public.public_seller_profiles limit 1;

-- Expect: view columns exclude sensitive fields (no user_id, id_document_url, linkedin_url).
-- select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'public_seller_profiles';

rollback;
