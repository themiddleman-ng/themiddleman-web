# Test purchase checklist (isolated database only)

**Never run this flow against production Supabase or live Paystack keys.**

## Preconditions

- Local Supabase (`supabase start`) or the escrow preview project `vhfskuabgsudbaiqotth` only. `scripts/test-purchase-flow.mjs` refuses production `uwigyojtiudefnwjezhm` and any other host.
- Migrations applied in order (see deployment report).
- Environment:
  - `NEXT_PUBLIC_SUPABASE_URL` → isolated project
  - `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `PAYSTACK_SECRET_KEY` starts with `sk_test_`
  - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` starts with `pk_test_`
  - `MARKETPLACE_ISOLATED_PREVIEW=true`
  - `MARKETPLACE_ESCROW_V2_ENABLED=true`
  - `ESCROW_GATEWAY_TEST_ENABLED=true`
  - FX vars if exercising USD fee display: `ESCROW_FX_NGN_PER_USD`, `ESCROW_FX_QUOTED_AT`, `ESCROW_FX_SOURCE`

## Automated runner

```bash
node scripts/test-purchase-flow.mjs --dry-run   # validates guards only
node scripts/test-purchase-flow.mjs             # full isolated flow (requires running app + DB)
```

The script exits non-zero if the Supabase URL looks like production or Paystack keys are not test keys.

## Manual happy path

1. Create buyer and approved seller with an active gig.
2. Enable gateway test flags and test Paystack keys.
3. Buyer opens gig → **Buy this product** → Paystack test payment succeeds.
4. Seller uploads delivery → buyer accepts.
5. Confirm escrow cron / payout path records provider evidence (isolated project).
6. Open dispute → resolve to refund → confirm order status `refunded`.

## Automated coverage in repo

- `tests/checkout-gate.test.mjs` — gateway guard matrix
- `tests/escrow-v2.test.mjs` — escrow configuration
- `tests/phase-c-payments.test.mjs` — payment route contracts
- `tests/phase-d-delivery.test.mjs` — delivery flow
- `scripts/test-purchase-flow.mjs` — orchestration stub (isolated only)
