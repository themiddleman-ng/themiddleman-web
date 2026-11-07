-- FILE ONLY. Not applied to any database.
-- Not verified against vhfskuabgsudbaiqotth. Never run this on uwigyojtiudefnwjezhm.
-- PGlite regression coverage is in tests/profile-role-escalation.test.mjs.
-- Do not apply this until a human has read the preflight output on the intended project.
--
-- The app admin gate reads public.profiles.role (buyer | seller | admin).
-- It does not read auth user_metadata and it does not read public.users.
-- Checked-in schema.sql and staging_bootstrap.sql create public.users WITHOUT a role column.
-- scripts/seed-isolated-db.sql and scripts/rls-test-suite.sql assume public.users.role exists.
-- That mismatch is unresolved without a live catalog. The users trigger below is created
-- only when that column is present.
--
-- Signup inserts profiles.role = buyer from handle_new_user_role(), which is
-- SECURITY DEFINER. That insert runs as the function owner, not as authenticated,
-- so this guard does not block normal account creation.
-- Onboarding writes public.users.is_buyer / is_seller. It does not write profiles.role.

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      if new.role is distinct from 'buyer'::public.user_role then
        raise exception 'profile role is assigned by the platform, not the account holder'
          using errcode = '42501';
      end if;
    elsif tg_op = 'UPDATE' and new.role is distinct from old.role then
      raise exception 'profile role is assigned by the platform, not the account holder'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role_insert on public.profiles;
drop trigger if exists protect_profile_role_update on public.profiles;
drop trigger if exists protect_profile_role on public.profiles;

create trigger protect_profile_role_insert
  before insert on public.profiles
  for each row
  execute function public.protect_profile_role();

create trigger protect_profile_role_update
  before update of role on public.profiles
  for each row
  execute function public.protect_profile_role();

revoke all on function public.protect_profile_role() from public, anon, authenticated;

-- Optional second table. Skipped when public.users has no role column.
create or replace function public.protect_users_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      if new.role::text is distinct from 'buyer' then
        raise exception 'account role is assigned by the platform, not the account holder'
          using errcode = '42501';
      end if;
    elsif tg_op = 'UPDATE' and new.role::text is distinct from old.role::text then
      raise exception 'account role is assigned by the platform, not the account holder'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.protect_users_role() from public, anon, authenticated;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'role'
  ) then
    execute 'drop trigger if exists protect_users_role_insert on public.users';
    execute 'drop trigger if exists protect_users_role_update on public.users';
    execute 'create trigger protect_users_role_insert before insert on public.users for each row execute function public.protect_users_role()';
    execute 'create trigger protect_users_role_update before update of role on public.users for each row execute function public.protect_users_role()';
  end if;
end;
$$;
