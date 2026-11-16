-- READ ONLY. Samuel runs this by hand in the SQL editor.
-- Project: the-middleman-escrow-preview, ref vhfskuabgsudbaiqotth.
-- This is not production. Production ref is uwigyojtiudefnwjezhm.
-- Confirm the dashboard URL contains vhfskuabgsudbaiqotth before running.
-- This file lists state and rolls back. It does not change data.
--
-- Verdict rule (also in docs/isolated-testing-without-docker.md):
-- If schema_migrations is missing, empty, or its versions are not a prefix of
-- the repo migration chain, or this output shows drift, reset the TEST project
-- and rebuild. Do not patch forward and do not touch production.
begin read only;

-- Tables in app schemas.
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname in ('public', 'private', 'storage')
order by 1, 2;

-- RLS policies.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'private', 'storage')
order by 1, 2, 3;

-- Applied-migration table. Null means schema_migrations is absent (divergence).
select to_regclass('supabase_migrations.schema_migrations') as schema_migrations;

select to_regclass('public.seller_profiles') as seller_profiles,
       to_regclass('public.gigs') as gigs,
       to_regclass('public.profiles') as profiles,
       to_regclass('auth.users') as auth_users,
       to_regclass('public.orders') as orders,
       to_regclass('public.payments') as payments,
       to_regclass('storage.objects') as storage_objects;

-- Payment reference columns, so the notice below can look for non-test refs.
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'payments'
  and column_name in ('reference', 'paystack_reference', 'provider_reference')
order by 1;

-- Exact counts, migration versions, and the no-real-data check.
-- Results are one NOTICE named INSPECT so a missing table does not abort.
do $inspect$
declare
  report jsonb := '{}'::jsonb;
  rel text;
  n bigint;
  versions jsonb;
  domains jsonb;
  newest timestamptz;
  ref_column text;
  flagged jsonb;
  buckets jsonb;
begin
  if to_regclass('supabase_migrations.schema_migrations') is null then
    report := report || jsonb_build_object('schema_migrations', 'missing');
  else
    execute 'select coalesce(jsonb_agg(jsonb_build_object(''version'', version, ''name'', name) order by version), ''[]''::jsonb) from supabase_migrations.schema_migrations'
      into versions;
    report := report || jsonb_build_object('schema_migrations', versions);
  end if;

  foreach rel in array array[
    'public.seller_profiles',
    'public.gigs',
    'public.profiles',
    'auth.users',
    'public.orders',
    'public.payments'
  ]
  loop
    if to_regclass(rel) is null then
      report := report || jsonb_build_object(rel, 'missing');
    else
      execute format('select count(*) from %s', rel) into n;
      report := report || jsonb_build_object(rel, n);
    end if;
  end loop;

  if to_regclass('auth.users') is null then
    report := report || jsonb_build_object('auth_users_email_domains', 'missing');
  else
    execute $q$
      select coalesce(jsonb_agg(jsonb_build_object(
        'domain', domain,
        'users', users,
        'max_created_at', max_created_at
      ) order by users desc), '[]'::jsonb)
      from (
        select split_part(email, '@', 2) as domain,
               count(*) as users,
               max(created_at) as max_created_at
        from auth.users
        group by 1
      ) domains
    $q$ into domains;
    execute 'select max(created_at) from auth.users' into newest;
    report := report || jsonb_build_object(
      'auth_users_email_domains', domains,
      'auth_users_max_created_at', newest
    );
  end if;

  if to_regclass('public.payments') is null then
    report := report || jsonb_build_object('non_test_paystack_references', 'missing');
  else
    select column_name into ref_column
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payments'
      and column_name in ('paystack_reference', 'reference', 'provider_reference')
    order by case column_name
      when 'paystack_reference' then 1
      when 'reference' then 2
      else 3
    end
    limit 1;
    if ref_column is null then
      report := report || jsonb_build_object('non_test_paystack_references', 'no reference column');
    else
      execute format($q$
        select coalesce(jsonb_agg(left(ref, 24) order by ref), '[]'::jsonb)
        from (
          select distinct %1$I as ref
          from public.payments
          where %1$I is not null
            and %1$I !~* 'test'
          limit 20
        ) refs
      $q$, ref_column) into flagged;
      report := report || jsonb_build_object(
        'paystack_reference_column', ref_column,
        'non_test_paystack_reference_prefixes', flagged
      );
    end if;
  end if;

  if to_regclass('storage.objects') is null then
    report := report || jsonb_build_object('storage_objects', 'missing');
  else
    execute $q$
      select coalesce(jsonb_agg(jsonb_build_object('bucket', bucket_id, 'objects', objects) order by bucket_id), '[]'::jsonb)
      from (
        select bucket_id, count(*) as objects
        from storage.objects
        group by bucket_id
      ) buckets
    $q$ into buckets;
    report := report || jsonb_build_object('storage_objects_per_bucket', buckets);
  end if;

  raise notice 'INSPECT %', report;
end
$inspect$;

rollback;
