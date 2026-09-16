-- Run this AFTER schema.sql and auth_trigger.sql.
-- Adds real persistence for the messages feature (previously local-state-only).

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.users(id),
  seller_id uuid not null references public.seller_profiles(user_id),
  gig_id uuid references public.gigs(id),
  buyer_last_read_at timestamptz,
  seller_last_read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (buyer_id, seller_id, gig_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  -- Server-side backstop for the same rule enforced client-side in
  -- app/messages/page.tsx (containsRestrictedContent). Client-side
  -- validation alone can be bypassed by calling the API directly, so
  -- this constraint is the real enforcement point.
  constraint messages_no_contact_sharing check (
    body !~* '(https?://|www\.)\S+'
    and body !~* '\b[a-z0-9-]+\.(com|net|org|ng|io|co|me|link)\b'
    and body !~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
    and body !~* '(\+?\d[\d\s-]{7,}\d)'
  )
);

create index messages_conversation_id_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "participants view their conversations" on public.conversations
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "participants start conversations" on public.conversations
  for insert with check (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "participants view their messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
    )
  );
create policy "participants send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
    )
  );

-- Required for the live-update subscription in app/messages/page.tsx.
-- Supabase Dashboard → Database → Replication → add 'messages' to the
-- supabase_realtime publication (or run the line below).
alter publication supabase_realtime add table public.messages;
