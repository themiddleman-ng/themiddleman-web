-- Explicitly opt in on an ISOLATED test database before applying this file:
-- select set_config('middleman.isolated_preview', 'true', false);
-- This is deliberately separate from migrations; never install on production.
do $$ begin
  if current_setting('middleman.isolated_preview',true) is distinct from 'true' then
    raise exception 'Isolated preview opt-in required';
  end if;
end $$;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function private.run_isolated_escrow_schedule()
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; worker_url text; worker_secret text; bypass text; headers jsonb;
begin
  result:=public.process_escrow_deadlines();
  select decrypted_secret into worker_url from vault.decrypted_secrets where name='escrow_preview_worker_url';
  select decrypted_secret into worker_secret from vault.decrypted_secrets where name='escrow_preview_cron_secret';
  if worker_url is null or worker_secret is null then return result; end if;
  if worker_url !~ '^https://[a-zA-Z0-9-]+[.]vercel[.]app/api/cron/escrow$' or length(worker_secret)<32 then
    raise exception 'Invalid preview worker configuration';
  end if;
  headers:=jsonb_build_object('Authorization','Bearer '||worker_secret);
  select decrypted_secret into bypass from vault.decrypted_secrets where name='escrow_preview_vercel_bypass';
  if bypass is not null then headers:=headers||jsonb_build_object('x-vercel-protection-bypass',bypass); end if;
  perform net.http_get(url:=worker_url,headers:=headers,timeout_milliseconds:=60000);
  return result;
end $$;
revoke all on function private.run_isolated_escrow_schedule() from public,anon,authenticated,service_role;
select cron.schedule('middleman-isolated-escrow','*/15 * * * *','select private.run_isolated_escrow_schedule();');
