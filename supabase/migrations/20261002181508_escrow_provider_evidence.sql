-- Supabase's default privileges otherwise grant TRUNCATE to service_role.
revoke all on public.order_fee_snapshots,public.escrow_ledger,public.delivery_downloads from service_role;
grant select,insert on public.order_fee_snapshots,public.escrow_ledger,public.delivery_downloads to service_role;
revoke delete,truncate,references,trigger on public.escrow_operations,public.seller_payout_accounts from service_role;

create function public.record_escrow_gateway_cost(p_reference text,p_cost_kobo bigint)
returns void language plpgsql security invoker set search_path='' as $$
declare oid uuid; total bigint; recorded bigint;
begin
  select p.order_id,f.buyer_total_kobo into oid,total from public.payments p
    join public.order_fee_snapshots f on f.order_id=p.order_id where p.paystack_reference=p_reference;
  if oid is null or p_cost_kobo is null or p_cost_kobo<0 or p_cost_kobo>total then
    raise exception 'Invalid gateway cost evidence';
  end if;
  insert into public.escrow_ledger(order_id,event_key,kind,amount_kobo,provider_reference,details)
    values(oid,'gateway_cost:'||p_reference,'gateway_processing_cost',p_cost_kobo,p_reference,
      jsonb_build_object('source','verified_paystack_fees','vat_separate',false))
    on conflict(event_key) do nothing;
  select amount_kobo into recorded from public.escrow_ledger where event_key='gateway_cost:'||p_reference;
  if recorded is distinct from p_cost_kobo then raise exception 'Conflicting immutable gateway cost'; end if;
end $$;
revoke all on function public.record_escrow_gateway_cost(text,bigint) from public,anon,authenticated;
grant execute on function public.record_escrow_gateway_cost(text,bigint) to service_role;
