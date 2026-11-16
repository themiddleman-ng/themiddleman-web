-- Waitlist tables: only admins can read them. The public form can still insert.
-- Applied to the TEST project vhfskuabgsudbaiqotth on 2026-11-10.
-- Production (uwigyojtiudefnwjezhm) is applied by Samuel only.
-- Rollback: supabase/rollbacks/20261110193919_waitlist_admin_only_reads_rollback.sql
--
-- Before: "Allow authenticated read on <table>" let ANY signed-in account read every
-- waitlist signup, team application and site visit (using (true)). anon and
-- authenticated also held UPDATE, DELETE and TRUNCATE grants. TRUNCATE is not
-- governed by RLS.
--
-- After:
--   anon           INSERT only (existing "Allow public insert on <table>" policy). No read-back.
--   authenticated  SELECT only when public.is_admin() is true. No insert, update, delete.
--   service_role   unchanged (bypasses RLS).
--
-- The old waitlist site inserts as anon. Its insert must not chain .select(),
-- because anon could never read these tables back, before or after this change.
-- This app does not read or write these tables.

begin;

-- early_access
drop policy if exists "Allow authenticated read on early_access" on public.early_access;
drop policy if exists "Admins read early_access" on public.early_access;
create policy "Admins read early_access" on public.early_access
  for select to authenticated
  using ((select public.is_admin()));
revoke select, update, delete, truncate on public.early_access from anon;
revoke update, delete, truncate on public.early_access from authenticated;

-- team_applications
drop policy if exists "Allow authenticated read on team_applications" on public.team_applications;
drop policy if exists "Admins read team_applications" on public.team_applications;
create policy "Admins read team_applications" on public.team_applications
  for select to authenticated
  using ((select public.is_admin()));
revoke select, update, delete, truncate on public.team_applications from anon;
revoke update, delete, truncate on public.team_applications from authenticated;

-- site_visits
drop policy if exists "Allow authenticated read on site_visits" on public.site_visits;
drop policy if exists "Admins read site_visits" on public.site_visits;
create policy "Admins read site_visits" on public.site_visits
  for select to authenticated
  using ((select public.is_admin()));
revoke select, update, delete, truncate on public.site_visits from anon;
revoke update, delete, truncate on public.site_visits from authenticated;

commit;
