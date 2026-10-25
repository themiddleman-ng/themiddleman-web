begin;

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

  select count(*)::integer into threads_today
  from public.conversations c
  where c.buyer_id = new.buyer_id
    and c.created_at >= date_trunc('day', timezone('utc', now()));

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
  add constraint messages_body_max_length check (char_length(body) <= 3000);

commit;
