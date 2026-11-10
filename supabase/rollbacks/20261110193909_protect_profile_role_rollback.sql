-- Rollback of 20261110193909_protect_profile_role.sql (role guard only). Run by hand only if needed.
-- Never run on uwigyojtiudefnwjezhm.
-- This drops the triggers and functions. It does not restore any role value,
-- and it does not undo a privilege grant that already existed.

drop trigger if exists protect_profile_role_insert on public.profiles;
drop trigger if exists protect_profile_role_update on public.profiles;
drop trigger if exists protect_profile_role on public.profiles;
drop function if exists public.protect_profile_role();

do $$
begin
  if to_regclass('public.users') is not null then
    execute 'drop trigger if exists protect_users_role_insert on public.users';
    execute 'drop trigger if exists protect_users_role_update on public.users';
  end if;
end;
$$;

drop function if exists public.protect_users_role();
