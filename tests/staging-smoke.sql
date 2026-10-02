-- Run only on the isolated escrow preview project, never production.
-- All fixture rows and changes roll back. No gateway requests or emails.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
('90000000-0000-4000-8000-000000000001','buyer-smoke@example.invalid','{"full_name":"Smoke Buyer","role":"admin"}'),
('90000000-0000-4000-8000-000000000002','seller-smoke@example.invalid','{"full_name":"Smoke Seller"}'),
('90000000-0000-4000-8000-000000000003','admin-smoke@example.invalid','{"full_name":"Smoke Admin"}');
do $$ begin
  if (select role from public.profiles where id='90000000-0000-4000-8000-000000000001')<>'buyer' then raise exception 'Metadata role injection'; end if;
  if not exists(select 1 from public.users where id='90000000-0000-4000-8000-000000000001' and email='buyer-smoke@example.invalid') then raise exception 'Signup trigger failed'; end if;
end $$;
update public.profiles set role='admin' where id='90000000-0000-4000-8000-000000000003';
insert into public.seller_profiles(id,user_id,display_name,bio,verification_status) values
('90000000-0000-4000-8000-000000000004','90000000-0000-4000-8000-000000000002','Smoke Creator','Test profile','approved');
insert into public.gigs(id,seller_id,title,description,category,price_ngn,is_exclusive,repo_url,preview_commit_sha) values
('90000000-0000-4000-8000-000000000005','90000000-0000-4000-8000-000000000004','Smoke repo product','Synthetic staging product','development',50000,true,'https://github.com/themiddleman-ng/themiddleman-web','39a396dadf4c04910f9a22a2798758037c805c73');
set local role service_role;
select public.admin_escrow_setting('90000000-0000-4000-8000-000000000003','listing','90000000-0000-4000-8000-000000000005','approved','Synthetic listing review');
do $$ declare c jsonb; oid uuid; did uuid; result text; hours numeric; job public.escrow_operations%rowtype;
begin
  c:=public.create_escrow_order('90000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000005','90000000-0000-4000-8000-000000000006',1500,now(),'illustrative test quote');
  oid:=(c->'order'->>'id')::uuid;
  if (c->'fees'->>'buyer_total_kobo')::bigint<>5322500 or (c->'fees'->>'seller_payout_kobo')::bigint<>4462500 then raise exception 'Fee arithmetic failed'; end if;
  result:=public.record_paystack_payment('mm_'||oid,5322500,'NGN'); if result<>'recorded' then raise exception 'Payment failed'; end if;
  result:=public.record_paystack_payment('mm_'||oid,5322500,'NGN'); if result<>'duplicate' then raise exception 'Replay failed'; end if;
  did:=public.submit_checked_order_delivery(oid,'90000000-0000-4000-8000-000000000002',oid||'/90000000-0000-4000-8000-000000000007.zip',repeat('a',64),100,'application/zip');
  perform public.review_order_delivery(did,'90000000-0000-4000-8000-000000000003',true,'Synthetic package and repo match');
  select extract(epoch from dispute_window_closes_at-delivered_at)/3600 into hours from public.deliveries where id=did;
  if hours<>72 then raise exception 'Review window trigger incorrect'; end if;
  perform public.accept_order_delivery(oid,'90000000-0000-4000-8000-000000000001');
  perform public.accept_order_delivery(oid,'90000000-0000-4000-8000-000000000001');
  if (select count(*) from public.escrow_operations where order_id=oid)<>1 then raise exception 'Payout duplicated'; end if;
  if (select escrow_status from public.payments where order_id=oid)<>'held' then raise exception 'Payout marked paid too early'; end if;
  perform public.admin_escrow_setting('90000000-0000-4000-8000-000000000003','recipient','90000000-0000-4000-8000-000000000004','RCP_smoketest','');
  select * into job from public.claim_escrow_operation();
  if job.amount_kobo<>4462500 or job.recipient_code<>'RCP_smoketest' then raise exception 'Recipient not locked'; end if;
  perform public.finish_escrow_operation(job.id,'succeeded','TRF_smoketest',null);
  perform public.finish_escrow_operation(job.id,'succeeded','TRF_smoketest',null);
  if (select count(*) from public.escrow_ledger where order_id=oid)<>2 then raise exception 'Ledger duplicated'; end if;
end $$;
reset role;
do $$ begin
  if has_function_privilege('authenticated','public.process_escrow_deadlines()','EXECUTE') then raise exception 'Client can release money'; end if;
  if has_table_privilege('authenticated','public.order_fee_snapshots','SELECT') then raise exception 'Client can read private fee records'; end if;
  if has_table_privilege('service_role','public.escrow_ledger','TRUNCATE') or has_table_privilege('service_role','public.order_fee_snapshots','TRUNCATE') then raise exception 'Service can truncate accounting'; end if;
  if exists(select 1 from pg_policies where schemaname='storage' and policyname='Allow authenticated uploads 18sed9p_0') then raise exception 'Catch-all upload policy remains'; end if;
end $$;
rollback;
select 'staging_signup_fees_exclusivity_delivery_review_acceptance_payout_replay_permissions_passed' result;
