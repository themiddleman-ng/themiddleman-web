-- Run this AFTER creating a PRIVATE bucket named 'verification-docs'
-- in Supabase Dashboard → Storage. (Bucket creation itself isn't
-- scriptable via SQL — do it manually first.)
--
-- Upload paths from app/onboarding/seller/page.js look like:
--   {user.id}/{timestamp}-{filename}
-- so a seller can only ever write into their own folder.

create policy "sellers upload their own verification doc"
  on storage.objects for insert
  with check (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "sellers read their own verification doc"
  on storage.objects for select
  using (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
