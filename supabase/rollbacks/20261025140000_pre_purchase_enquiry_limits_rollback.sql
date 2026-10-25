begin;

-- Drops private.conversation_has_paid_order. That function treated only
-- in_escrow, delivered, approved, and disputed as paid (a paying buyer is
-- not enquiry-capped). pending_payment and refunded were intentionally
-- excluded. Restoring this file removes that bypass entirely.

drop index if exists public.conversations_enquiry_one_per_buyer_gig;

drop trigger if exists enforce_conversation_enquiry_limits on public.conversations;
drop function if exists private.enforce_conversation_enquiry_limits();
drop function if exists private.conversation_has_paid_order(uuid, uuid, uuid);

alter table public.messages
  drop constraint if exists messages_body_max_length;

commit;
