begin;

create schema if not exists private;

alter table public.seller_payout_accounts
  add column if not exists bank_code text,
  add column if not exists bank_name text,
  add column if not exists account_name text,
  add column if not exists account_last4 text,
  add column if not exists currency text not null default 'NGN',
  add column if not exists verification_provider text not null default 'paystack',
  add column if not exists updated_at timestamptz not null default now();

alter table public.seller_payout_accounts enable row level security;
revoke all on public.seller_payout_accounts from public, anon, authenticated;
grant select, insert, update on public.seller_payout_accounts to service_role;

alter table public.seller_payout_accounts
  add constraint seller_payout_accounts_bank_code_format
    check (bank_code is null or bank_code ~ '^[a-zA-Z0-9_-]{2,12}$'),
  add constraint seller_payout_accounts_account_last4_format
    check (account_last4 is null or account_last4 ~ '^[0-9]{4}$'),
  add constraint seller_payout_accounts_currency_ngn
    check (currency = 'NGN'),
  add constraint seller_payout_accounts_provider_paystack
    check (verification_provider = 'paystack');

create table public.user_onboarding_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  experience_choice text not null check (experience_choice in ('new','veteran')),
  walkthrough_status text not null check (walkthrough_status in ('in_progress','completed','skipped')),
  current_step smallint not null default 0 check (current_step between 0 and 4),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_onboarding_preferences enable row level security;
revoke all on public.user_onboarding_preferences from public, anon;
grant select, insert, update on public.user_onboarding_preferences to authenticated;

create policy "users read their onboarding preference"
  on public.user_onboarding_preferences for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users create their onboarding preference"
  on public.user_onboarding_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users update their onboarding preference"
  on public.user_onboarding_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table private.seller_payout_verification_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  attempts smallint not null default 0 check (attempts >= 0)
);
alter table private.seller_payout_verification_attempts enable row level security;
revoke all on private.seller_payout_verification_attempts from public, anon, authenticated;

create or replace function public.consume_seller_payout_verification_attempt(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempts smallint;
begin
  if p_user_id is null then return false; end if;
  insert into private.seller_payout_verification_attempts(user_id, window_started_at, attempts)
  values (p_user_id, now(), 1)
  on conflict (user_id) do update
  set window_started_at = case
        when private.seller_payout_verification_attempts.window_started_at < now() - interval '24 hours'
          then now()
        else private.seller_payout_verification_attempts.window_started_at
      end,
      attempts = case
        when private.seller_payout_verification_attempts.window_started_at < now() - interval '24 hours'
          then 1
        else least(private.seller_payout_verification_attempts.attempts::integer + 1, 9)::smallint
      end
  returning attempts into v_attempts;
  return v_attempts <= 8;
end;
$$;

revoke all on function public.consume_seller_payout_verification_attempt(uuid) from public, anon, authenticated;
grant execute on function public.consume_seller_payout_verification_attempt(uuid) to service_role;

commit;
