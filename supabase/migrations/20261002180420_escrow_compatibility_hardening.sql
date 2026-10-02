-- The historical four-argument function has defaults, making two-argument
-- calls ambiguous. Preserve its implementation under an explicit legacy name.
alter function public.calculate_transaction_fees(bigint,numeric,bigint,numeric)
  rename to calculate_transaction_fees_legacy;
revoke all on function public.calculate_transaction_fees_legacy(bigint,numeric,bigint,numeric)
  from public,anon,authenticated,service_role;
-- The legacy exclusive lock does not bind ownership to a paid order.
revoke all on function public.claim_exclusive_gig(uuid)
  from public,anon,authenticated,service_role;
