# Phase C: signed Paystack payments

## Implemented

- POST `/api/payments/webhook` validates HMAC SHA-512 over raw bytes using a constant-time comparison before parsing or database access. Payload limit: 256 KiB.
- Only signed `charge.success`, correct test/live domain, positive integer kobo, NGN and canonical `mm_<order UUID>` references are processed.
- The signed reference binds the payment to its order. No browser-supplied order ID or amount is trusted for recording.
- A service-role-only SECURITY INVOKER RPC locks the order, compares exact amount, inserts the real `payments` columns and updates `pending_payment -> in_escrow` atomically.
- Unique payment per order and existing unique reference prevent duplicate recording. Retries after later status changes do not regress the order.
- Browser callback is notification-only, returning 202; checkout redirects to My Orders. The order can remain pending until the webhook arrives.
- Narrow database guards protect order identity/amount and pending-payment transitions; client payment writes are revoked. No anonymity SELECT policies or deliveries changed.
- No transfers/payouts/refunds are executed. `held`/`pending` are database bookkeeping, not proof of a regulated escrow product.

## Deployment gate

Read-only live inspection on September 17 found `orders.idempotency_key` missing. Phase B migration must be applied before Phase C. No live migrations were applied during this implementation.

1. Confirm Phase A is applied; review and apply `20260917124827_phase_b_server_authoritative_orders.sql`. It requires an empty orders table and deliberately refuses otherwise. Do not remove its safety guard or delete records to bypass it.
2. Review/apply `20260917215825_phase_c_verified_paystack.sql` transactionally. It requires Phase B and fails if existing payments violate one-payment-per-order. Investigate any failure, never drop data.
3. Preview environment must have `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (pk_test_...), and `PAYSTACK_SECRET_KEY` (matching sk_test_...). Never expose a secret/service key with NEXT_PUBLIC or commit real values.
4. Deploy this commit to Preview, not main. Rebuild after changing public environment variables.
5. Set Paystack TEST webhook URL to `https://<preview-host>/api/payments/webhook`. It must be reachable by Paystack without a Vercel sign-in wall. Resolve deployment protection using an approved configuration before testing; don't put bypass secrets in source control.
6. Use a non-seller test buyer and an actual Paystack test-mode transaction. Confirm one payment row (`held`, `pending`) and order `in_escrow`. Retry the same signed event and confirm no second payment or second state update. Never send a real charge for this test.
7. Check invalid signature returns 401 with no writes and browser `/api/payments/verify` returns 202 without mutation.

## Local verification

`node --test tests/*.test.mjs`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build`.

PGlite verifies privileges, amount/currency checks, duplicate requests, rollback on a failed second write and no status regression on retry. It is single-connection; multi-connection production contention has NOT been stress-tested. A row lock and unique index enforce correctness at PostgreSQL level.

No Paystack test-mode credentials or external payment transaction were used locally. The live end-to-end gate above remains mandatory. Phase D/E and production approval remain out of scope.

References: https://paystack.com/docs/payments/webhooks/ and https://supabase.com/docs/reference/javascript/rpc
