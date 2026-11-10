-- Rollback of 20261110193919_waitlist_admin_only_reads.sql. Run by hand only if needed.
-- Never run on uwigyojtiudefnwjezhm unless the forward migration was applied there.
-- WARNING: this restores the old, insecure state where any signed-in account can
-- read every waitlist row. It restores policies and grants exactly as they were on
-- vhfskuabgsudbaiqotth before 2026-11-10. It does not touch any row.

begin;

drop policy if exists "Admins read early_access" on public.early_access;
drop policy if exists "Allow authenticated read on early_access" on public.early_access;
create policy "Allow authenticated read on early_access" on public.early_access
  for select to authenticated using (true);
grant select, update, delete, truncate on public.early_access to anon;
grant update, delete, truncate on public.early_access to authenticated;

drop policy if exists "Admins read team_applications" on public.team_applications;
drop policy if exists "Allow authenticated read on team_applications" on public.team_applications;
create policy "Allow authenticated read on team_applications" on public.team_applications
  for select to authenticated using (true);
grant select, update, delete, truncate on public.team_applications to anon;
grant update, delete, truncate on public.team_applications to authenticated;

drop policy if exists "Admins read site_visits" on public.site_visits;
drop policy if exists "Allow authenticated read on site_visits" on public.site_visits;
create policy "Allow authenticated read on site_visits" on public.site_visits
  for select to authenticated using (true);
grant select, update, delete, truncate on public.site_visits to anon;
grant update, delete, truncate on public.site_visits to authenticated;

commit;
