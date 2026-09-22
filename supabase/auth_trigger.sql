-- Run this AFTER schema.sql.
-- Reads full_name / phone out of raw_user_meta_data (set via the
-- `options.data` object passed to supabase.auth.signUp() in
-- app/signup/page.js) and creates the matching public.users row.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, phone, state)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'state'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
