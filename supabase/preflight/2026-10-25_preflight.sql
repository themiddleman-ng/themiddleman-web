-- READ-ONLY pre-flight for production. Samuel runs this manually; do not apply migrations from this file.
begin read only;

-- Long messages that would fail once messages_body_max_length is validated
select count(*) as long_message_count
from public.messages
where char_length(body) > 3000;

select id, conversation_id, char_length(body) as body_length, left(body, 80) as body_preview
from public.messages
where char_length(body) > 3000
order by char_length(body) desc
limit 20;

-- Duplicate enquiry threads per buyer + product (gig)
select buyer_id, gig_id, count(*) as thread_count
from public.conversations
where gig_id is not null
group by buyer_id, gig_id
having count(*) > 1
order by thread_count desc
limit 50;

-- Current seller_profiles RLS policies
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'seller_profiles'
order by policyname;

-- Table- and column-level grants on seller_profiles
select grantee, privilege_type, is_grantable
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'seller_profiles'
order by grantee, privilege_type;

select grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'seller_profiles'
order by grantee, column_name, privilege_type;

-- Views introduced by 20261025130000 (if already present)
select table_schema, table_name, view_definition
from information_schema.views
where table_schema = 'public'
  and table_name in ('public_seller_profiles', 'public_seller_profile_cards');

-- private schema (required for enquiry triggers)
select exists(
  select 1 from information_schema.schemata where schema_name = 'private'
) as private_schema_exists;

-- gig_wishlists migration target
select exists(
  select 1
  from information_schema.tables
  where table_schema = 'public' and table_name = 'gig_wishlists'
) as gig_wishlists_exists;

-- Applied migrations. 20261025140001 is manual (supabase/manual/, not db push).
-- A row here means someone already ran the validation file by hand.
select version, name
from supabase_migrations.schema_migrations
where version in (
  '20261025120000',
  '20261025130000',
  '20261025140000',
  '20261025140001'
)
order by version;

rollback;
