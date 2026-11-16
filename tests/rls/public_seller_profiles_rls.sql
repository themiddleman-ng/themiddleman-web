-- Manual RLS checks for public_seller_profiles (local Supabase only).
-- Run via scripts/run-rls-tests.mjs after seeding.

-- Expect: anon and authenticated cannot read another seller's row, including
-- id_document_url and linkedin_url. Authenticated may read only their own row.
-- select id_document_url, linkedin_url from public.seller_profiles limit 1;

-- Expect: anon can read approved directory rows from the view only.
-- select id, display_name from public.public_seller_profiles limit 1;

-- Expect: pending sellers are absent from the view.
-- select count(*) from public.public_seller_profiles sp
--   join public.seller_profiles raw on raw.id = sp.id
--   where raw.verification_status = 'pending';
