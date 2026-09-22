alter table public.gigs
  add column gallery_image_paths text[] not null default '{}',
  add column demo_video_path text,
  add column demo_links text[] not null default '{}';
alter table public.gigs add constraint gigs_gallery_count check (cardinality(gallery_image_paths) <= 4);
alter table public.gigs add constraint gigs_demo_links_count check (cardinality(demo_links) <= 3);

-- Marketplace artwork is public by design. ID documents and order deliveries
-- remain in their separate private buckets.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('gig-media','gig-media',true,20971520,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict(id) do nothing;
create policy "seller uploads own gig media" on storage.objects
  for insert to authenticated
  with check (bucket_id='gig-media' and
    split_part(name,'/',1)=(select auth.uid())::text and
    split_part(name,'/',2)='gigs');
create policy "seller removes own gig media" on storage.objects
  for delete to authenticated
  using (bucket_id='gig-media' and
    split_part(name,'/',1)=(select auth.uid())::text and
    split_part(name,'/',2)='gigs');
