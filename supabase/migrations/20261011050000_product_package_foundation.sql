begin;

create table if not exists public.product_versions (
  id uuid primary key,
  gig_id uuid not null references public.gigs(id) on delete cascade,
  seller_profile_id uuid not null references public.seller_profiles(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  storage_path text not null unique,
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  content_type text not null check (content_type in (
    'application/zip', 'application/pdf', 'image/png', 'image/jpeg', 'text/plain'
  )),
  file_size bigint not null check (file_size between 1 and 10485760),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  security_status text not null default 'structural_pass'
    check (security_status in ('structural_pass', 'failed', 'needs_manual_review')),
  review_status text not null default 'awaiting_review'
    check (review_status in ('awaiting_review', 'changes_requested', 'rejected', 'approved')),
  validation_report jsonb not null default '{}'::jsonb
    check (jsonb_typeof(validation_report) = 'object'),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  uploaded_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_category text,
  review_notes text,
  is_current boolean not null default false,
  unique (gig_id, version_number),
  check (
    storage_path ~ (
      '^' || gig_id::text || '/' || id::text || '/package[.](zip|pdf|png|jpg|jpeg|txt)$'
    )
  )
);

create index if not exists product_versions_review_queue_idx
  on public.product_versions (review_status, uploaded_at);
create index if not exists product_versions_seller_idx
  on public.product_versions (seller_profile_id, uploaded_at desc);
create unique index if not exists product_versions_one_current_per_gig
  on public.product_versions (gig_id) where is_current;

alter table public.gigs
  add column if not exists current_product_version_id uuid
    references public.product_versions(id) on delete set null;

alter table public.orders
  add column if not exists product_version_id uuid
    references public.product_versions(id) on delete restrict;

create index if not exists orders_product_version_idx
  on public.orders (product_version_id) where product_version_id is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-packages',
  'product-packages',
  false,
  10485760,
  array['application/zip', 'application/pdf', 'image/png', 'image/jpeg', 'text/plain']
)
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Remove the existing all-bucket authenticated upload policy. Preview media keeps
-- its seller-specific policy; product packages are uploaded with one-use signed tokens.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd = 'INSERT'
      and roles::text[] @> array['authenticated']::text[]
      and lower(trim(coalesce(with_check, ''), '() ')) = 'true'
  loop
    execute format('drop policy %I on storage.objects', existing_policy.policyname);
  end loop;
end
$$;

create table if not exists public.marketplace_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_id uuid references auth.users(id) on delete set null,
  gig_id uuid references public.gigs(id) on delete set null,
  product_version_id uuid references public.product_versions(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  idempotency_key text not null unique,
  properties jsonb not null default '{}'::jsonb
    check (jsonb_typeof(properties) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists marketplace_events_gig_time_idx
  on public.marketplace_events (gig_id, created_at desc);
create index if not exists marketplace_events_order_type_idx
  on public.marketplace_events (order_id, event_type);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('system', 'admin', 'order')),
  notification_type text not null,
  title text not null,
  body text not null,
  href text,
  event_key text not null unique,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_inbox_idx
  on public.notifications (recipient_user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (recipient_user_id, created_at desc)
  where read_at is null;

create table if not exists public.operational_threads (
  id uuid primary key default gen_random_uuid(),
  seller_user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  context_type text not null check (context_type in (
    'seller_account', 'gig', 'product_version', 'order', 'dispute', 'payout'
  )),
  context_id uuid,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_user_id, context_type, context_id)
);

create index if not exists operational_threads_seller_idx
  on public.operational_threads (seller_user_id, updated_at desc);

create table if not exists public.operational_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.operational_threads(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  sender_kind text not null check (sender_kind in ('seller', 'admin', 'system')),
  body text not null check (char_length(body) between 1 and 5000),
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

create index if not exists operational_messages_thread_idx
  on public.operational_messages (thread_id, created_at);

create table if not exists public.transactional_email_outbox (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  template_key text not null,
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.product_versions enable row level security;
alter table public.marketplace_events enable row level security;
alter table public.notifications enable row level security;
alter table public.operational_threads enable row level security;
alter table public.operational_messages enable row level security;
alter table public.transactional_email_outbox enable row level security;

revoke all on public.product_versions from anon, authenticated;
revoke all on public.marketplace_events from anon, authenticated;
revoke all on public.notifications from anon, authenticated;
revoke all on public.operational_threads from anon, authenticated;
revoke all on public.operational_messages from anon, authenticated;
revoke all on public.transactional_email_outbox from anon, authenticated;

grant select on public.product_versions to authenticated;
grant select, update (read_at) on public.notifications to authenticated;
grant select on public.operational_threads to authenticated;
grant select, insert on public.operational_messages to authenticated;

create policy "Sellers and MFA admins read product version metadata"
  on public.product_versions for select to authenticated
  using (
    exists (
      select 1 from public.seller_profiles seller
      where seller.id = product_versions.seller_profile_id
        and seller.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
        and (select auth.jwt() ->> 'aal') = 'aal2'
    )
  );

create policy "Recipients read their notifications"
  on public.notifications for select to authenticated
  using (recipient_user_id = (select auth.uid()));

create policy "Recipients mark their notifications read"
  on public.notifications for update to authenticated
  using (recipient_user_id = (select auth.uid()))
  with check (recipient_user_id = (select auth.uid()));

create policy "Sellers and MFA admins read operational threads"
  on public.operational_threads for select to authenticated
  using (
    seller_user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
        and (select auth.jwt() ->> 'aal') = 'aal2'
    )
  );

create policy "Thread participants read operational messages"
  on public.operational_messages for select to authenticated
  using (
    exists (
      select 1
      from public.operational_threads thread
      where thread.id = operational_messages.thread_id
        and (
          thread.seller_user_id = (select auth.uid())
          or exists (
            select 1 from public.profiles profile
            where profile.id = (select auth.uid())
              and profile.role = 'admin'
              and (select auth.jwt() ->> 'aal') = 'aal2'
          )
        )
    )
  );

create policy "Sellers reply in their operational threads"
  on public.operational_messages for insert to authenticated
  with check (
    sender_kind = 'seller'
    and sender_id = (select auth.uid())
    and exists (
      select 1 from public.operational_threads thread
      where thread.id = operational_messages.thread_id
        and thread.seller_user_id = (select auth.uid())
        and thread.status = 'open'
    )
  );

create or replace function public.submit_product_version(
  p_gig_id uuid,
  p_seller_uid uuid,
  p_version_id uuid,
  p_storage_path text,
  p_original_filename text,
  p_content_type text,
  p_file_size bigint,
  p_sha256 text,
  p_validation_report jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  gig_row public.gigs%rowtype;
  seller_row public.seller_profiles%rowtype;
  next_version integer;
  saved public.product_versions%rowtype;
begin
  select * into gig_row from public.gigs where id = p_gig_id for update;
  if not found then raise exception 'Product not found'; end if;

  select * into seller_row
  from public.seller_profiles
  where id = gig_row.seller_id and user_id = p_seller_uid
  for share;
  if not found or seller_row.verification_status <> 'approved' then
    raise exception 'Approved seller access required' using errcode = '42501';
  end if;

  if gig_row.status not in ('draft', 'pending_review', 'changes_requested', 'rejected', 'active') then
    raise exception 'Product cannot accept a package in this state';
  end if;
  if p_version_id is null
    or p_storage_path !~ (
      '^' || p_gig_id::text || '/' || p_version_id::text || '/package[.](zip|pdf|png|jpg|jpeg|txt)$'
    )
    or char_length(p_original_filename) not between 1 and 255
    or p_original_filename ~ '[[:cntrl:]]'
    or p_file_size not between 1 and 10485760
    or p_content_type not in ('application/zip', 'application/pdf', 'image/png', 'image/jpeg', 'text/plain')
    or p_sha256 !~ '^[a-f0-9]{64}$'
    or jsonb_typeof(coalesce(p_validation_report, '{}'::jsonb)) <> 'object'
    or octet_length(coalesce(p_validation_report, '{}'::jsonb)::text) > 65536 then
    raise exception 'Package metadata is invalid';
  end if;

  select coalesce(max(version_number), 0) + 1 into next_version
  from public.product_versions where gig_id = p_gig_id;

  insert into public.product_versions (
    id, gig_id, seller_profile_id, version_number, storage_path,
    original_filename, content_type, file_size, sha256, security_status,
    review_status, validation_report, uploaded_by
  ) values (
    p_version_id, p_gig_id, gig_row.seller_id, next_version, p_storage_path,
    p_original_filename, p_content_type, p_file_size, p_sha256, 'structural_pass',
    'awaiting_review', coalesce(p_validation_report, '{}'::jsonb), p_seller_uid
  ) returning * into saved;

  if gig_row.current_product_version_id is null then
    update public.gigs set status = 'pending_review', updated_at = now()
    where id = p_gig_id;
  end if;

  insert into public.marketplace_events (
    event_type, actor_id, gig_id, product_version_id, idempotency_key, properties
  ) values (
    'product_package.submitted', p_seller_uid, p_gig_id, p_version_id,
    'product-package-submitted:' || p_version_id::text,
    jsonb_build_object(
      'version_number', next_version,
      'file_size', p_file_size,
      'content_type', p_content_type,
      'sha256', p_sha256
    )
  ) on conflict (idempotency_key) do nothing;

  return jsonb_build_object(
    'id', saved.id,
    'gig_id', saved.gig_id,
    'version_number', saved.version_number,
    'review_status', saved.review_status
  );
end
$function$;

create or replace function public.review_product_version(
  p_version_id uuid,
  p_admin_uid uuid,
  p_decision text,
  p_reason_category text,
  p_notes text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  version_row public.product_versions%rowtype;
  gig_row public.gigs%rowtype;
  seller_row public.seller_profiles%rowtype;
  recipient uuid;
  thread_id uuid;
  next_status text;
  notice_title text;
  notice_body text;
  notice_type text;
  email_template text;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_admin_uid and role = 'admin'
  ) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  if p_decision not in ('approve', 'request_changes', 'reject') then
    raise exception 'Invalid product review decision';
  end if;
  if p_reason_category not in (
    'listing_description', 'misleading_preview', 'product_package',
    'missing_files', 'prohibited_content', 'suspicious_files',
    'licensing_copyright', 'pricing_concern', 'seller_verification', 'other'
  ) then
    raise exception 'Invalid review reason category';
  end if;
  if char_length(coalesce(p_notes, '')) > 2000
    or (p_decision <> 'approve' and char_length(trim(coalesce(p_notes, ''))) < 5) then
    raise exception 'A clear review note is required';
  end if;

  select * into version_row
  from public.product_versions where id = p_version_id for update;
  if not found or version_row.review_status <> 'awaiting_review' then
    raise exception 'Product version is not awaiting review';
  end if;
  if p_decision = 'approve' and version_row.security_status <> 'structural_pass' then
    raise exception 'Package must pass structural checks before approval';
  end if;

  select * into gig_row from public.gigs where id = version_row.gig_id for update;
  select * into seller_row from public.seller_profiles where id = version_row.seller_profile_id for share;
  recipient := seller_row.user_id;

  next_status := case p_decision
    when 'approve' then 'approved'
    when 'request_changes' then 'changes_requested'
    else 'rejected'
  end;

  update public.product_versions
  set review_status = next_status,
      review_category = p_reason_category,
      review_notes = nullif(trim(coalesce(p_notes, '')), ''),
      reviewed_by = p_admin_uid,
      reviewed_at = now(),
      is_current = (p_decision = 'approve')
  where id = p_version_id;

  if p_decision = 'approve' then
    update public.product_versions set is_current = false
    where gig_id = gig_row.id and id <> p_version_id and is_current;
    update public.gigs
    set current_product_version_id = p_version_id, status = 'active', updated_at = now()
    where id = gig_row.id;
    notice_title := 'Your product is live';
    notice_body := '"' || gig_row.title || '" passed review and is available in the marketplace.';
    notice_type := 'listing_approved';
    email_template := 'product_approved';
  elsif p_decision = 'request_changes' then
    if gig_row.current_product_version_id is null then
      update public.gigs set status = 'changes_requested', updated_at = now()
      where id = gig_row.id;
    end if;
    notice_title := 'Changes needed';
    notice_body := 'We reviewed "' || gig_row.title || '" and need updates before this product can go live. ' || trim(p_notes);
    notice_type := 'listing_changes_requested';
    email_template := 'product_changes_requested';
  else
    if gig_row.current_product_version_id is null then
      update public.gigs set status = 'rejected', updated_at = now()
      where id = gig_row.id;
    end if;
    notice_title := 'Product not approved';
    notice_body := 'We could not approve "' || gig_row.title || '". ' || trim(p_notes);
    notice_type := 'listing_rejected';
    email_template := 'product_rejected';
  end if;

  insert into public.notifications (
    recipient_user_id, source, notification_type, title, body, href, event_key
  ) values (
    recipient, 'admin', notice_type, notice_title, notice_body, '/gigs/mine',
    'product-review:' || p_version_id::text
  ) on conflict (event_key) do nothing;

  insert into public.marketplace_events (
    event_type, actor_id, gig_id, product_version_id, idempotency_key, properties
  ) values (
    'product_version.reviewed', p_admin_uid, gig_row.id, p_version_id,
    'product-version-reviewed:' || p_version_id::text,
    jsonb_build_object('decision', p_decision, 'reason_category', p_reason_category)
  ) on conflict (idempotency_key) do nothing;

  insert into public.operational_threads (
    seller_user_id, subject, context_type, context_id, status, created_by
  ) values (
    recipient, 'Product review: ' || gig_row.title, 'product_version', p_version_id, 'open', p_admin_uid
  )
  on conflict (seller_user_id, context_type, context_id)
  do update set updated_at = now()
  returning id into thread_id;

  insert into public.operational_messages (
    thread_id, sender_id, sender_kind, body, idempotency_key
  ) values (
    thread_id, p_admin_uid, 'admin', notice_body,
    'product-review-message:' || p_version_id::text
  ) on conflict (idempotency_key) do nothing;

  insert into public.transactional_email_outbox (
    event_key, recipient_user_id, template_key, payload
  ) values (
    'product-review-email:' || p_version_id::text,
    recipient,
    email_template,
    jsonb_build_object(
      'gig_id', gig_row.id,
      'gig_title', gig_row.title,
      'version_id', p_version_id,
      'decision', p_decision,
      'reason_category', p_reason_category,
      'notes', trim(coalesce(p_notes, ''))
    )
  ) on conflict (event_key) do nothing;

  insert into public.admin_audit_log (
    actor_id, action, target_type, target_id, details
  ) values (
    p_admin_uid,
    'product_version_' || p_decision,
    'product_version',
    p_version_id,
    jsonb_build_object(
      'gig_id', gig_row.id,
      'reason_category', p_reason_category,
      'notes', trim(coalesce(p_notes, ''))
    )
  );

  return jsonb_build_object(
    'version_id', p_version_id,
    'gig_id', gig_row.id,
    'seller_user_id', recipient,
    'review_status', next_status,
    'notification_id', (
      select id from public.notifications where event_key = 'product-review:' || p_version_id::text
    ),
    'thread_id', thread_id,
    'email_event_key', 'product-review-email:' || p_version_id::text
  );
end
$function$;

create or replace function public.capture_order_product_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_version uuid;
begin
  if new.product_version_id is null then
    select version.id into current_version
    from public.gigs gig
    join public.product_versions version
      on version.id = gig.current_product_version_id
     and version.gig_id = gig.id
     and version.review_status = 'approved'
     and version.security_status = 'structural_pass'
     and version.is_current
    where gig.id = new.gig_id
      and gig.seller_id = new.seller_id
      and gig.status = 'active'
    for share of gig, version;

    if current_version is null then
      raise exception 'This product does not have an approved package version for sale';
    end if;
    new.product_version_id := current_version;
  end if;

  if not exists (
    select 1
    from public.product_versions version
    join public.gigs gig on gig.id = version.gig_id
    where version.id = new.product_version_id
      and version.gig_id = new.gig_id
      and version.seller_profile_id = new.seller_id
      and version.review_status = 'approved'
      and version.security_status = 'structural_pass'
      and version.is_current
      and gig.current_product_version_id = version.id
      and gig.status = 'active'
  ) then
    raise exception 'Order must snapshot the current approved product version';
  end if;

  return new;
end
$function$;

drop trigger if exists orders_capture_product_version on public.orders;
create trigger orders_capture_product_version
  before insert on public.orders
  for each row execute function public.capture_order_product_version();

create or replace function public.prevent_order_product_version_change()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.product_version_id is distinct from old.product_version_id then
    raise exception 'Purchased product version is immutable';
  end if;
  return new;
end
$function$;

drop trigger if exists orders_product_version_immutable on public.orders;
create trigger orders_product_version_immutable
  before update of product_version_id on public.orders
  for each row execute function public.prevent_order_product_version_change();

revoke all on function public.submit_product_version(uuid, uuid, uuid, text, text, text, bigint, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.submit_product_version(uuid, uuid, uuid, text, text, text, bigint, text, jsonb)
  to service_role;
revoke all on function public.review_product_version(uuid, uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.review_product_version(uuid, uuid, text, text, text)
  to service_role;

commit;
