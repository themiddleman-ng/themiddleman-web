-- Prepared for review only; do not apply to production before release approval.
begin;
alter table public.gigs alter column status set default 'pending_review';
-- Existing package review functions return these states. Preserve legacy states.
alter table public.gigs drop constraint if exists gigs_status_check;
alter table public.gigs add constraint gigs_status_check
  check (status in ('draft','pending_review','changes_requested','rejected','active','paused','deleted'));

create or replace function public.enforce_listing_review()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  -- Trusted server review functions run as their owner; browser writes do not.
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if TG_OP = 'INSERT' then
    if new.status <> 'pending_review' then
      raise exception 'New listings require review' using errcode = '42501';
    end if;
    return new;
  end if;
  if new.seller_id is distinct from old.seller_id then
    raise exception 'Listing ownership is immutable' using errcode = '42501';
  end if;
  if old.status = 'deleted' then
    raise exception 'Deleted listings cannot be restored by clients' using errcode = '42501';
  end if;
  if new.status is distinct from old.status and new.status not in ('pending_review','paused','deleted') then
    raise exception 'Only reviewed listings can be published' using errcode = '42501';
  end if;
  -- Any edited public content or package pointer must be reviewed again.
  if (to_jsonb(new) - array['status','updated_at']) is distinct from
     (to_jsonb(old) - array['status','updated_at']) and new.status <> 'deleted' then
    new.status := 'pending_review';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_listing_review() from public, anon, authenticated;
drop trigger if exists gigs_enforce_listing_review on public.gigs;
create trigger gigs_enforce_listing_review before insert or update on public.gigs
  for each row execute function public.enforce_listing_review();
-- Archive through UPDATE, preserving transactional references.
revoke delete on public.gigs from public, anon, authenticated;
commit;
