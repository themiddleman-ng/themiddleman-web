begin;

create or replace function private.conversation_has_paid_order(
  p_buyer_id uuid,
  p_seller_user_id uuid,
  p_gig_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.orders o
    join public.seller_profiles sp on sp.id = o.seller_id
    where o.buyer_id = p_buyer_id
      and sp.user_id = p_seller_user_id
      and o.gig_id is not distinct from p_gig_id
      -- Paid bypass. Compare production `select status, count(*) from public.orders group by 1`
      -- (supabase/preflight/2026-10-25_preflight.sql) to this list before applying.
      --
      -- public.order_status is only these six values (schema + phase A). Writers:
      --   pending_payment — order insert / escrow checkout RPC. Paystack has not settled.
      --                     Do not bypass: the buyer has not paid.
      --   in_escrow       — phase C verify and escrow v2 after a successful charge.
      --                     Also the status while a seller-timeout refund is only queued.
      --                     Bypass: money has been taken and not confirmed returned.
      --   delivered       — admin release (phase D and escrow v2). Bypass: buyer has paid.
      --   approved        — buyer accept, auto-accept, dispute closed with no refund,
      --                     or a succeeded payout. Bypass: purchase completed.
      --   disputed        — open dispute. A partial refund leaves the order here until
      --                     payout sets approved or a full refund sets refunded.
      --                     Bypass: the buyer has paid and the case is still open.
      --   refunded        — finish_escrow_operation when the refund equals buyer_total.
      --                     Do not bypass: the purchase was fully reversed. The app
      --                     still reuses an existing (buyer_id, gig_id) thread; this
      --                     status only stops a refunded order from waiving the daily cap.
      -- No other order status is produced by webhooks, cron, or the escrow v2 functions.
      and o.status in ('in_escrow', 'delivered', 'approved', 'disputed')
  );
$$;

revoke all on function private.conversation_has_paid_order(uuid, uuid, uuid) from public, anon, authenticated;

-- Enquiry limits apply even when rows are inserted with the service role.
create or replace function private.enforce_conversation_enquiry_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  threads_today integer;
begin
  if new.buyer_id = new.seller_id then
    raise exception 'enquiry_self_messaging_blocked' using errcode = 'P0001';
  end if;

  if private.conversation_has_paid_order(new.buyer_id, new.seller_id, new.gig_id) then
    return new;
  end if;

  select count(*)::integer into threads_today
  from public.conversations c
  where c.buyer_id = new.buyer_id
    and c.created_at >= date_trunc('day', timezone('utc', now()))
    and not private.conversation_has_paid_order(c.buyer_id, c.seller_id, c.gig_id);

  if threads_today >= 10 then
    raise exception 'enquiry_daily_thread_limit' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_conversation_enquiry_limits() from public, anon, authenticated;

drop trigger if exists enforce_conversation_enquiry_limits on public.conversations;
create trigger enforce_conversation_enquiry_limits
  before insert on public.conversations
  for each row
  execute function private.enforce_conversation_enquiry_limits();

alter table public.messages
  drop constraint if exists messages_body_max_length;

alter table public.messages
  add constraint messages_body_max_length check (char_length(body) <= 3000) not valid;

-- conversations has no open/closed status column; one enquiry thread per buyer per product
-- is enforced on (buyer_id, gig_id) when gig_id is set (a gig maps to one seller).
create unique index if not exists conversations_enquiry_one_per_buyer_gig
  on public.conversations (buyer_id, gig_id)
  where gig_id is not null;

commit;
