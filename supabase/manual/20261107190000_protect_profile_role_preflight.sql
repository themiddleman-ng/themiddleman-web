-- READ ONLY. Do not run on uwigyojtiudefnwjezhm.
-- Not executed against vhfskuabgsudbaiqotth by this change. No live inventory was verified.
-- Review the result before considering the trigger file. This file changes nothing.

select current_database() as database_name, current_user as current_user;

select table_name, column_name, data_type, udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles', 'users')
  and column_name in ('role', 'is_buyer', 'is_seller')
order by table_name, column_name;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('profiles', 'users')
  and grantee in ('authenticated', 'anon', 'service_role', 'public')
order by table_name, grantee, privilege_type;

select grantee, table_name, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in ('profiles', 'users')
  and grantee in ('authenticated', 'anon')
order by table_name, column_name, grantee;

select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'users')
order by tablename, policyname;

select proname
from pg_proc
join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
where nspname = 'public'
  and proname in ('handle_new_user_role', 'protect_profile_role', 'protect_users_role');

-- Counts only. No emails, names, or ids.
select role::text as profile_role, count(*) as n
from public.profiles
group by role
order by profile_role;
