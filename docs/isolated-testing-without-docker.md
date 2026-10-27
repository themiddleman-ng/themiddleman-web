# Isolated testing without Docker

Use this when you cannot run `supabase start` locally (no Docker) but still need to exercise RLS scripts, admin MFA, and `/admin` against a real database.

## Which project is “isolated”?

Only two Supabase projects exist. Both are on the free plan. There is no third project.

| Role | Name | Project ref | Host |
| --- | --- | --- | --- |
| Production | production | `uwigyojtiudefnwjezhm` | `uwigyojtiudefnwjezhm.supabase.co` |
| Test / escrow preview | the-middleman-escrow-preview | `vhfskuabgsudbaiqotth` | `vhfskuabgsudbaiqotth.supabase.co` |

These refs are different projects. Scripts that talk to a database (`scripts/db-isolated-guard.mjs`) allow **only** `vhfskuabgsudbaiqotth` and localhost. They refuse `uwigyojtiudefnwjezhm` and every other host.

The app’s checkout gate (`lib/server/escrow-config.mjs`) is separate: it still treats any host other than production as non-production. That does not authorize pointing scripts or `supabase db push` at a random project. Use the escrow preview or localhost.

Escrow writes, checkout, disputes, and product-package admin features only unlock when:

- `MARKETPLACE_ISOLATED_PREVIEW=true`
- `MARKETPLACE_ESCROW_V2_ENABLED=true` (for escrow v2)
- `ESCROW_GATEWAY_TEST_ENABLED=true` plus Paystack **test** keys (for checkout)
- `NEXT_PUBLIC_SUPABASE_URL` is not `uwigyojtiudefnwjezhm.supabase.co`
- `VERCEL_ENV` is not `production`

`docs/ESCROW_IMPLEMENTATION_REPORT.md` records that the preview project was created empty (schema and buckets only, no production rows).

## Confirm you are pointed at isolated (guards)

Before `psql`, `supabase db push`, or `node scripts/run-rls-tests.mjs`:

```bash
node -e "import { assertIsolatedSupabaseUrl, PRODUCTION_SUPABASE_HOST } from './scripts/db-isolated-guard.mjs'; const u=process.env.NEXT_PUBLIC_SUPABASE_URL; assertIsolatedSupabaseUrl(u); console.log('OK', u, '(production is', PRODUCTION_SUPABASE_HOST+')');"
```

Scripts that call the guard (`assertIsolatedSupabaseUrl` / `assertIsolatedSupabaseEnv`):

- `scripts/run-rls-tests.mjs` — checks `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_DB_URL`, and `DATABASE_URL` when that is set
- `scripts/seed-test-admin.mjs` — same
- `scripts/test-purchase-flow.mjs` — requires `NEXT_PUBLIC_SUPABASE_URL` and checks `SUPABASE_DB_URL` when set

They accept:

- Local Supabase API URL (`http://127.0.0.1:54321`) or local Postgres (`127.0.0.1:54322`)
- Hosted URLs whose project ref is `vhfskuabgsudbaiqotth` (`https://vhfskuabgsudbaiqotth.supabase.co` or `db.vhfskuabgsudbaiqotth.supabase.co`)

They **reject** `uwigyojtiudefnwjezhm` and any other Supabase project. Both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_DB_URL` are checked when set. A production value in either variable is refused even if the other variable is the preview project.

## Apply migrations (isolated only)

**Never** run against production.

1. In the Supabase SQL editor for the isolated project, paste migrations from `supabase/migrations/` in timestamp order through the latest file.
2. Or, with the Supabase CLI and the isolated DB password:

```bash
# Host must be db.vhfskuabgsudbaiqotth.supabase.co. Keep the password in your shell, not in chat or git.
export SUPABASE_DB_URL="postgresql://postgres:<password>@db.vhfskuabgsudbaiqotth.supabase.co:5432/postgres"
export NEXT_PUBLIC_SUPABASE_URL="https://vhfskuabgsudbaiqotth.supabase.co"
node -e "import { assertIsolatedSupabaseEnv } from './scripts/db-isolated-guard.mjs'; assertIsolatedSupabaseEnv();"
supabase db push --db-url "$SUPABASE_DB_URL"
```

Run `supabase/manual/20261025140001_validate_messages_body_max_length.sql` by hand only after `supabase/preflight/2026-10-25_preflight.sql` shows `long_message_count = 0`. It is not under `supabase/migrations`, so `supabase db push` will not validate the constraint early. Samuel runs preflight on production; on the isolated project, run the same preflight there before validating.

## Inspect the test project (read only)

Run `supabase/preflight/test-project-inspect.sql` in the SQL editor for `vhfskuabgsudbaiqotth` only. It starts with `begin read only` and ends with `rollback`. Read the `INSPECT` notice for row counts, `auth.users` email domains (not full addresses), max `created_at`, order and payment counts, payment references that do not contain `test`, and storage objects per bucket.

`docs/ESCROW_IMPLEMENTATION_REPORT.md` says this project was loaded from `supabase/staging_bootstrap.sql`, then `20261002172833_escrow_fulfilment_v2.sql`, `20261002180420_escrow_compatibility_hardening.sql`, and `20261002181508_escrow_provider_evidence.sql`, plus `supabase/staging_scheduler.sql`. That history may not be recorded in `supabase_migrations.schema_migrations`. Treat the inspect output as the source of truth. Do not assume those files are still the only objects present.

## Migrations the test project needs, in order

`supabase/migrations` is an incremental chain. The early files alter tables that `supabase/staging_bootstrap.sql` creates; they are not a greenfield schema by themselves. `supabase/manual/20261025140001_validate_messages_body_max_length.sql` is not part of `supabase db push`.

Repo migration order:

1. `20260917123912_phase_a_order_identity_and_status.sql`
2. `20260917124827_phase_b_server_authoritative_orders.sql`
3. `20260917215825_phase_c_verified_paystack.sql`
4. `20260922232250_phase_d_order_delivery_review.sql`
5. `20260922233036_phase_e_private_buyer_records.sql`
6. `20260922234759_phase_f_gig_media.sql`
7. `20260925163052_security_seller_profile_and_gig_authority.sql`
8. `20261002172833_escrow_fulfilment_v2.sql`
9. `20261002173700_payment_email_delivery_tracking.sql`
10. `20261002180420_escrow_compatibility_hardening.sql`
11. `20261002181500_payment_admin_email_and_ops.sql`
12. `20261002181508_escrow_provider_evidence.sql`
13. `20261011050000_product_package_foundation.sql`
14. `20261011060000_product_package_delivery.sql`
15. `20261012110000_seller_payout_onboarding.sql`
16. `20261012130000_account_deletion.sql`
17. `20261012170000_profile_avatars.sql`
18. `20261025120000_gig_wishlists.sql`
19. `20261025130000_public_seller_profiles.sql`
20. `20261025140000_pre_purchase_enquiry_limits.sql`

Then, by hand, only after preflight `long_message_count = 0`: `supabase/manual/20261025140001_validate_messages_body_max_length.sql`.

**Verdict rule.** If `schema_migrations` is missing or empty, the version list is not a prefix of the list above, any extra version appears, or the inspect output shows missing tables or unexpected policies, stop. Do not apply the next file as a patch. Reset the test project and rebuild from the repo migrations in order. A prefix is acceptable only when the missing tail is the not-yet-applied end of that list and nothing else differs.

**Reset on the free plan, without touching production.** There is no third project and no paid restore. Do not create one.

1. Open `https://supabase.com/dashboard/project/vhfskuabgsudbaiqotth` and check the ref in the URL. Do not open `uwigyojtiudefnwjezhm`.
2. In that project’s SQL editor, drop and recreate the app schemas (`private` if present, then `public`). Leave the `auth` and `storage` schemas installed. Delete test users under Authentication and empty buckets under Storage in this same project.
3. Run `supabase/staging_bootstrap.sql` once. That file is the base schema the migration chain alters. It is not itself a migration version.
4. Apply `supabase/migrations` in the order above, on this project only. If a statement fails because the bootstrap already created that object, stop and record the error. Do not skip ahead by editing production, and do not mark a version applied if its statements did not run.
5. Re-run `supabase/preflight/test-project-inspect.sql`. `schema_migrations` should list the versions you actually applied, in order, with no extras.

`supabase db push` records versions. Pasting SQL in the editor does not, unless you insert the version yourself after a successful run. A pasted history with an empty `schema_migrations` table is divergence and matches the reset rule.

## Where keys go

Nothing from production belongs in the test project: not the database password, not the anon key, not the service-role key, not storage, and not a copy of production rows.

| Key | Where it may live | Where it must not live |
| --- | --- | --- |
| Test project anon key | Local gitignored `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or Vercel env for a non-production deployment that uses the test URL | Production Vercel env, chat, commits, issues |
| Test project service-role key | Local gitignored `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`, or Vercel environment variables | Browser (`NEXT_PUBLIC_…`), chat, the repo, production |
| Production anon and service-role keys | Production Vercel env only, set by Samuel in the dashboard | The test project, `.env.local` used for tests, chat, commits |
| Database password | A shell variable for `SUPABASE_DB_URL` while a command runs | Chat, git, Vercel as a public variable |

Service-role keys are server-only. Never paste a key into chat or into a file that is committed. `.env.local` stays gitignored.

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
| `NEXT_PUBLIC_SUPABASE_URL` | `uwigyojtiudefnwjezhm.supabase.co` | `vhfskuabgsudbaiqotth.supabase.co` or localhost |
| Paystack | Live keys (when enabled) | `pk_test_` / `sk_test_` only with `ESCROW_GATEWAY_TEST_ENABLED` |
| Email | Resend/production templates | Dev inboxes or suppressed |
| Checkout / escrow writes | Gated off on shared previews | Enabled only with isolated flags + test keys |
