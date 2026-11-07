-- FILE ONLY. Do not apply this to production from the app change.
-- A signed-in account must not be able to set profiles.role, including to admin.
-- Role is read from public.profiles. It is not read from user_metadata.
-- postgres and service_role can still assign a role. authenticated and anon cannot.

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and current_user in ('authenticated', 'anon') then
    raise exception 'profile role is assigned by the platform, not the account holder';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update of role on public.profiles
  for each row
  execute function public.protect_profile_role();

revoke all on function public.protect_profile_role() from public, anon, authenticated;
