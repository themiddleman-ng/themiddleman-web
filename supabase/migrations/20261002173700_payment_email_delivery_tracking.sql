-- Track transactional notification delivery separately from payment state.
-- This lets duplicate payment verification safely retry a failed email without
-- duplicating a payment or re-sending messages already marked as sent.
create table if not exists public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event text not null check (event in ('payment_settled')),
  recipient_role text not null check (recipient_role in ('buyer','seller')),
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  provider_message_id text,
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  unique(order_id, event, recipient_role)
);

alter table public.email_notifications enable row level security;
revoke all on public.email_notifications from public, anon, authenticated;
grant select, insert, update on public.email_notifications to service_role;

create index if not exists email_notifications_order_event_idx
  on public.email_notifications(order_id, event);
