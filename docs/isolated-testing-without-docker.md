# Isolated testing without Docker

Use this when you cannot run `supabase start` locally (no Docker) but still need to exercise RLS scripts, admin MFA, and `/admin` against a real database.

## Which project is “isolated”?

The app treats **production** as the hosted project `uwigyojtiudefnwjezhm.supabase.co` (see `lib/server/escrow-config.mjs`). Escrow writes, checkout, disputes, and product-package admin features only unlock when:

- `MARKETPLACE_ISOLATED_PREVIEW=true`
- `MARKETPLACE_ESCROW_V2_ENABLED=true` (for escrow v2)
- `ESCROW_GATEWAY_TEST_ENABLED=true` plus Paystack **test** keys (for checkout)
- `NEXT_PUBLIC_SUPABASE_URL` points at **any** Supabase host **except** `uwigyojtiudefnwjezhm.supabase.co`
- `VERCEL_ENV` is not `production`

There is no hard-coded isolated project id in the repo. Create a **second free-tier Supabase project** (e.g. `the-middleman-escrow-preview` documented in `docs/ESCROW_IMPLEMENTATION_REPORT.md`) and use its URL/keys only on preview machines.

## Confirm you are pointed at isolated (guards)

Before `psql`, `supabase db push`, or `node scripts/run-rls-tests.mjs`:

```bash
node -e "import { assertIsolatedSupabaseUrl, PRODUCTION_SUPABASE_HOST } from './scripts/db-isolated-guard.mjs'; const u=process.env.NEXT_PUBLIC_SUPABASE_URL; assertIsolatedSupabaseUrl(u); console.log('OK', u, '(production is', PRODUCTION_SUPABASE_HOST+')');"
```

Scripts that call `assertIsolatedSupabaseUrl`:

- `scripts/run-rls-tests.mjs`
- `scripts/seed-test-admin.mjs`

They accept:

- Local Supabase API URL (`http://127.0.0.1:54321`) or local Postgres (`127.0.0.1:54322`)
- Another `*.supabase.co` project that is **not** production

They **reject** `uwigyojtiudefnwjezhm.supabase.co`.

## Apply migrations (isolated only)

**Never** run against production.

1. In the Supabase SQL editor for the isolated project, paste migrations from `supabase/migrations/` in timestamp order through the latest file.
2. Or, with the Supabase CLI and the isolated DB password:

```bash
export SUPABASE_DB_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
node -e "import { assertIsolatedSupabaseUrl } from './scripts/db-isolated-guard.mjs'; assertIsolatedSupabaseUrl(process.env.SUPABASE_DB_URL);"
supabase db push --db-url "$SUPABASE_DB_URL"
```

Run `supabase/migrations/20261025140001_validate_messages_body_max_length.sql` only after `supabase/preflight/2026-10-25_preflight.sql` shows `long_message_count = 0` on production (Samuel runs preflight on prod; validate on isolated after the same check there).

## Seed data

- `scripts/seed-isolated-db.sql` — base marketplace seed (run via `psql` on isolated DB).
- `scripts/seed-test-admin.mjs <user-uuid>` — promotes a user to `admin` after signup (isolated only).

Enable TOTP MFA for the admin user in Supabase Auth before testing `/admin` (the app requires AAL2).

## Run automated tests

```bash
pnpm test
```

RLS SQL suite (requires `psql` + isolated URL):

```bash
export SUPABASE_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"  # or isolated hosted URL
node scripts/run-rls-tests.mjs
```

Unit tests under `tests/rls/` use PGlite and do not need Docker.

## Admin walkthrough (local Next + isolated Supabase)

1. Copy `.env.example` to `.env.local` with isolated `NEXT_PUBLIC_SUPABASE_URL` and anon key; set `SUPABASE_SERVICE_ROLE_KEY` for server routes.
2. Set `MARKETPLACE_ISOLATED_PREVIEW=true` and any feature flags you need (`MARKETPLACE_PRODUCT_PACKAGES_ENABLED`, `MARKETPLACE_PRE_PURCHASE_ENQUIRY_ENABLED`, etc.).
3. `pnpm dev` and sign in as the seeded admin (MFA enrolled).
4. Walk routes listed in `scripts/admin-walk.mjs` or open `/admin` navigation.
5. Optional: `UI_AUDIT_BASE_URL=http://127.0.0.1:3000 node scripts/admin-walk.mjs` (guest redirects should be 200 to sign-in, not 404).

## Cleanup

- Revoke preview env vars on your machine.
- Drop test users/data in the isolated project or reset the database from the Supabase dashboard.
- Do not copy production data into the isolated project.

## Isolated vs production

| Area | Production | Isolated preview |
| --- | --- | --- |
| Data | Live users, orders, payouts | Test accounts only |
| Migrations | Applied manually by operator | Same files, applied on isolated project first |
| Auth / MFA | Real users | Test users; enroll MFA for admin tests |
| Storage buckets | Live media & ID docs | Empty or test uploads |
| `NEXT_PUBLIC_SUPABASE_URL` | `uwigyojtiudefnwjezhm.supabase.co` | Any other project URL |
| Paystack | Live keys (when enabled) | `pk_test_` / `sk_test_` only with `ESCROW_GATEWAY_TEST_ENABLED` |
| Email | Resend/production templates | Dev inboxes or suppressed |
| Checkout / escrow writes | Gated off on shared previews | Enabled only with isolated flags + test keys |
