-- Add an operations recipient and a server-only operational settings store.
alter table public.email_notifications
  drop constraint if exists email_notifications_recipient_role_check;

alter table public.email_notifications
  add constraint email_notifications_recipient_role_check
  check (recipient_role in ('buyer','seller','admin'));

create table if not exists public.platform_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;
revoke all on public.platform_settings from public, anon, authenticated;
grant select, insert, update on public.platform_settings to service_role;

insert into public.platform_settings(key, value)
values ('admin_notification_email', 'oluwabukunmioguntona@gmail.com')
on conflict (key) do update
  set value = excluded.value, updated_at = now();
