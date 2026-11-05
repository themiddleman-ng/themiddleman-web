-- Minimal anon-safe fixtures for local Supabase only. Apply after full migration chain.
-- Run: psql "$DATABASE_URL" -f scripts/seed-isolated-db.sql

insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, instance_id)
values
  ('11111111-1111-4111-8111-111111111101', 'buyer-a@test.local', crypt('test-pass', gen_salt('bf')), now(), '{}', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
  ('11111111-1111-4111-8111-111111111102', 'buyer-b@test.local', crypt('test-pass', gen_salt('bf')), now(), '{}', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
  ('22222222-2222-4222-8222-222222222201', 'seller-approved@test.local', crypt('test-pass', gen_salt('bf')), now(), '{}', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
  ('22222222-2222-4222-8222-222222222202', 'seller-pending@test.local', crypt('test-pass', gen_salt('bf')), now(), '{}', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000')
on conflict (id) do nothing;

insert into public.users (id, email, full_name, role, is_seller)
values
  ('11111111-1111-4111-8111-111111111101', 'buyer-a@test.local', 'Buyer A', 'buyer', false),
  ('11111111-1111-4111-8111-111111111102', 'buyer-b@test.local', 'Buyer B', 'buyer', false),
  ('22222222-2222-4222-8222-222222222201', 'seller-approved@test.local', 'Sample seller', 'seller', true),
  ('22222222-2222-4222-8222-222222222202', 'seller-pending@test.local', 'Sample seller (pending)', 'seller', true)
on conflict (id) do nothing;

insert into public.seller_profiles (id, user_id, display_name, bio, verification_status, id_document_url)
values
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', 'Sample seller', 'Sample seller profile for the isolated database. Not a real person.', 'approved', 'verification-docs/secret-approved.pdf'),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222202', 'Sample seller (pending)', 'Sample seller profile for the isolated database. Not a real person.', 'pending', 'verification-docs/secret-pending.pdf')
on conflict (id) do nothing;

insert into public.gigs (id, seller_id, title, description, category, price_ngn, status, gallery_image_paths)
values
  ('44444444-4444-4444-8444-444444444401', '33333333-3333-4333-8333-333333333301', 'Invoice & Expense Tracker', 'Sample listing: a Naira invoice and expense spreadsheet for a Nigerian small business.', 'development', 8500, 'active', ARRAY['/images/listings/invoice-tracker.webp']),
  ('44444444-4444-4444-8444-444444444402', '33333333-3333-4333-8333-333333333301', 'Restaurant Menu Template', 'Sample draft listing: an editable menu for a small restaurant, with room for Naira prices.', 'design', 6500, 'draft', ARRAY['/images/listings/menu-template.webp'])
on conflict (id) do nothing;

insert into public.gig_wishlists (user_id, gig_id)
values ('11111111-1111-4111-8111-111111111101', '44444444-4444-4444-8444-444444444401')
on conflict do nothing;
