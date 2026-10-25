# Browse-only launch runbook

Samuel runs every step. This file does not change Vercel, DNS, or any database. Checkout stays paused. Do not merge pull requests as part of this launch. Do not paste keys into chat or into git.

There is no `main` branch in this repository. `origin/HEAD` is `feat/product-first-homepage`. The README still says production deploys from `main`. That sentence is stale. The live sites below still serve the old waitlist, not this app:

- https://themiddleman.com.ng — “Hire Verified Nigerian Tech Talent” / “Get early access”
- https://www.themiddleman.com.ng — same waitlist (confirm after deploy)
- https://themiddleman-web.vercel.app — same project’s Vercel host (confirm it is this project before switching)

Recommended launch branch: **`design/ui8-dark`** (PR #10). The light branch `design/ui8-fixes` (PR #9, head `dbe7ed7`) does not contain the October 25 database fixes or this browse-only copy. Do not launch the light branch.

## (a) Pre-flight on production

Project ref **`uwigyojtiudefnwjezhm` only**. Open that project’s SQL editor and run `supabase/preflight/2026-10-25_preflight.sql`. It is `begin read only` … `rollback`.

Read before any migration:

- `long_message_count` must be `0` before the manual validation file. If it is not, do not validate `messages_body_max_length`. Shorten or archive those messages first, then re-run preflight.
- Duplicate `(buyer_id, gig_id)` conversation rows must be resolved before `20261025140000`, or the unique index will fail.
- `select status, count(*) from public.orders group by 1` must be compared with the paid list in `20261025140000`: bypass `in_escrow`, `delivered`, `approved`, `disputed`; do not bypass `pending_payment` or `refunded`. Any other status is drift. Stop and do not apply that migration until the list is updated.
- Confirm `private` exists and `gig_wishlists` does not already exist.

## (b) Tests on the test project

Project ref **`vhfskuabgsudbaiqotth`** (`the-middleman-escrow-preview`). It is not production. There is no third project.

1. Run `supabase/preflight/test-project-inspect.sql` (read only, ends in `rollback`).
2. Apply the verdict rule in `docs/isolated-testing-without-docker.md`. If `schema_migrations` is missing, diverged, or drift shows up, reset **this project only** and rebuild. Do not copy production data in.
3. Point local `.env.local` at this project’s URL and its own anon key. Service-role key only in that gitignored file.
4. `pnpm test`, then the flows in `docs/test-purchase-checklist.md` only with Paystack **test** keys. `scripts/test-purchase-flow.mjs` refuses any host other than localhost and `vhfskuabgsudbaiqotth`.

## (c) Apply migrations in order

Run on the test project first. Repeat on production only after (a) and (b) look right. Paste in the SQL editor or `supabase db push` against that project’s database URL. The guard refuses production URLs from this repo’s scripts; production apply is a manual dashboard step by Samuel.

1. `supabase/migrations/20260917123912_phase_a_order_identity_and_status.sql`
2. `supabase/migrations/20260917124827_phase_b_server_authoritative_orders.sql`
3. `supabase/migrations/20260917215825_phase_c_verified_paystack.sql`
4. `supabase/migrations/20260922232250_phase_d_order_delivery_review.sql`
5. `supabase/migrations/20260922233036_phase_e_private_buyer_records.sql`
6. `supabase/migrations/20260922234759_phase_f_gig_media.sql`
7. `supabase/migrations/20260925163052_security_seller_profile_and_gig_authority.sql`
8. `supabase/migrations/20261002172833_escrow_fulfilment_v2.sql`
9. `supabase/migrations/20261002173700_payment_email_delivery_tracking.sql`
10. `supabase/migrations/20261002180420_escrow_compatibility_hardening.sql`
11. `supabase/migrations/20261002181500_payment_admin_email_and_ops.sql`
12. `supabase/migrations/20261002181508_escrow_provider_evidence.sql`
13. `supabase/migrations/20261011050000_product_package_foundation.sql`
14. `supabase/migrations/20261011060000_product_package_delivery.sql`
15. `supabase/migrations/20261012110000_seller_payout_onboarding.sql`
16. `supabase/migrations/20261012130000_account_deletion.sql`
17. `supabase/migrations/20261012170000_profile_avatars.sql`
18. `supabase/migrations/20261025120000_gig_wishlists.sql`
19. `supabase/migrations/20261025130000_public_seller_profiles.sql`
20. `supabase/migrations/20261025140000_pre_purchase_enquiry_limits.sql`

Skip any version already present in `supabase_migrations.schema_migrations` for that project. Do not re-run a version that is already recorded.

**Manual, not part of `supabase db push`:** `supabase/manual/20261025140001_validate_messages_body_max_length.sql` only after preflight shows `long_message_count = 0` on the database you are validating.

Record each successful file in `schema_migrations` if you pasted it by hand. An empty migration table after a paste is divergence.

## (d) Admin account with MFA

Do this on the database the site will use (production, when launching).

1. Sign up through the app with the operator email.
2. In the SQL editor for **that** project, set the role the app actually checks:

```sql
update public.profiles
set role = 'admin'
where id = '<operator-auth-user-uuid>';
```

`scripts/seed-test-admin.mjs` refuses production and updates `public.users`, which is not the admin check. Do not use it on production.

3. Sign in, open `/security`, and enroll TOTP (Google Authenticator or Authy). `/admin` stays closed until the session is AAL2 with a verified factor.
4. Sign in again and confirm `/admin` opens only after the authenticator code.

## (e) Vercel environment variable names

Names only. Set values in the Vercel dashboard. Do not put production keys in the test project.

**Required for browse-only**

| Name | Why |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production URL `https://uwigyojtiudefnwjezhm.supabase.co` on the production deployment |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client. RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | Server routes (orders, messages, admin). Never `NEXT_PUBLIC_` |

**Optional for browse-only** (leave unset or false so checkout stays off)

| Name | Leave like this for browse-only |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://themiddleman.com.ng` when you want canonical email links |
| `NEXT_PUBLIC_SITE_URL` | Same host, used by account-deletion mail |
| `NEXT_PUBLIC_SITE_NAME` | `The Middleman` |
| `RESEND_API_KEY` | Unset: signup mail returns “not configured” and the page still loads |
| `RESEND_FROM_EMAIL` | Only with a verified Resend sender |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Unset on production. Test keys only on the preview project |
| `PAYSTACK_SECRET_KEY` | Unset on production |
| `MARKETPLACE_ISOLATED_PREVIEW` | Do not set `true` on production |
| `MARKETPLACE_ESCROW_V2_ENABLED` | `false` or unset |
| `ESCROW_GATEWAY_TEST_ENABLED` | `false` or unset |
| `ESCROW_CRON_SECRET` | Unset while the cron is not running |
| `ESCROW_FX_NGN_PER_USD`, `ESCROW_FX_QUOTED_AT`, `ESCROW_FX_SOURCE` | Unset |
| `MARKETPLACE_ANALYTICS_PEPPER` | Unset until analytics is wanted |
| `MARKETPLACE_PRODUCT_PACKAGES_ENABLED` | Unset |
| `NEXT_PUBLIC_MARKETPLACE_PRODUCT_PACKAGES_ENABLED` | Unset |
| `MARKETPLACE_PRE_PURCHASE_ENQUIRY_ENABLED` | Unset. Messaging stays limited to a paid order, which cannot be created while checkout is paused |

`VERCEL_ENV` is set by Vercel. Production keeps `gatewayTestEnabled()` false even if someone sets the escrow flags, because those flags also require `VERCEL_ENV !== production` and a non-production Supabase host.

## (f) Make this branch the production deployment

Do not merge PR #9 or PR #10 to “create production”. Merging #10 into `design/ui8-fixes` would mix this dark branch into the light branch. Merging #9 does not publish the dark launch.

| | PR #9 | PR #10 |
| --- | --- | --- |
| Branch | `design/ui8-fixes` (`dbe7ed7`) | `design/ui8-dark` (launch head) |
| Theme | Light | Dark |
| Base | `feat/product-first-homepage` | `design/ui8-fixes` |
| Use for launch | No. Stale. Later database and copy fixes are not on it | Yes |

**Option 1 — set the Vercel production branch (preferred).** In the Vercel project that owns the domains, set Production Branch to `design/ui8-dark`. Leave the Git branch as it is. The next production deployment builds that branch. No `main` branch is required. This does not merge the pull request.

**Option 2 — create `main` from the launch head.** From an up-to-date `design/ui8-dark`, create `main` at that commit and push it (normal push, not a force-push). Then set Vercel’s Production Branch to `main` so it matches the README. Do this only if you want the README’s branch name. Do not point `main` at `design/ui8-fixes` or `feat/product-first-homepage`.

**Waitlist page and signup data.** This repository has no waitlist table and does not import those signups. Before the production deployment changes:

1. Export the current “Get early access” list from wherever that page writes (the old deployment’s form backend or database). Save the export outside the repo.
2. Keep the export. The new homepage will not show those people.
3. Do not delete production Supabase rows to “make room”. If the waitlist lives in `uwigyojtiudefnwjezhm`, the rows stay until you delete them yourself. The new app simply does not render that page.
4. The previous Vercel deployment is the way back to the waitlist page (see rollback). Export first anyway, in case that deployment is later removed.

**Domain checks after the deployment is Ready.**

- `https://themiddleman.com.ng` shows “Find digital products that work.” and says purchases are paused. It must not show “Hire Verified Nigerian Tech Talent”.
- `https://www.themiddleman.com.ng` matches the apex or redirects to it once, with a valid certificate.
- `https://themiddleman-web.vercel.app` is the same build or redirects to the custom domain.
- Do not change DNS records unless a host does not point at this Vercel project. If a host still shows the waitlist after a successful production deployment, the domain is attached to a different project. Fix the attachment in Vercel; do not create a third Supabase project.

## (g) Post-deploy smoke test (15)

1. Apex homepage is this app, not the waitlist headline.
2. `www` matches the apex.
3. `themiddleman-web.vercel.app` matches or redirects.
4. Homepage copy says purchases are paused and does not offer a live Paystack button.
5. `/marketplace` loads (listings or an empty state, no server error).
6. A product page shows price in Naira and a paused purchase control. No charge starts.
7. Sign up creates an account.
8. Sign out and sign in again.
9. Seller onboarding can be submitted without a bank account (payout setup stays off).
10. Signed-in wishlist or save on a product responds without a 500.
11. `POST /api/conversations` without a paid order returns 403 while `MARKETPLACE_PRE_PURCHASE_ENQUIRY_ENABLED` is unset.
12. `/orders` and `/payments` load for a signed-in user and do not start checkout.
13. `/legal/terms` still contains “All payments on The Middleman are held in escrow” (wording not rewritten in this launch).
14. `/admin` without a verified authenticator does not show the dashboard.
15. `POST /api/orders` returns the paused-purchases error and does not create a Paystack charge.

## (h) Rollback

**Vercel.** Deployments → the previous Production deployment (the waitlist build) → Promote to Production. That is instant and does not need a git revert. Do this if the new homepage is wrong, sign-in is broken, or domains show an error.

**Database.** Only if a migration from (c) was applied and must be undone. Run the matching file in `supabase/rollbacks/` for that version, newest first. October 25 files:

- Undo validation by hand only if you ran the manual file (drop is in `supabase/rollbacks/20261025140000_pre_purchase_enquiry_limits_rollback.sql`, which also removes the enquiry trigger).
- `supabase/rollbacks/20261025140000_pre_purchase_enquiry_limits_rollback.sql`
- `supabase/rollbacks/20261025130000_public_seller_profiles_rollback.sql`
- `supabase/rollbacks/20261025120000_gig_wishlists_rollback.sql` if that file exists; otherwise leave wishlists in place rather than inventing a drop.

There is no rollback file for every historical migration. Do not drop production tables to “undo” phase A–F. If an early migration fails halfway, stop and restore from a Supabase backup you already have. Free-plan projects do not have a paid point-in-time restore. Take a logical export before applying on production if you need a way back.

**Env.** If a flag was turned on by mistake, set `MARKETPLACE_ESCROW_V2_ENABLED`, `MARKETPLACE_ISOLATED_PREVIEW`, and `ESCROW_GATEWAY_TEST_ENABLED` back to false or remove them, then redeploy. Do not rotate keys in chat.
