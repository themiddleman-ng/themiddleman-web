# Escrow and admin implementation report

Implemented on `fix/paystack-preview-finalization`, continuing commit
`39a396dadf4c04910f9a22a2798758037c805c73`. Production code, database,
environment variables, payment accounts and DNS were not changed. PR #4 remains
a draft against `security/audit-hardening`; this work is not a production merge.

## Database findings and decisions

The deployed application uses **orders and payments**, linked by
`deliveries.order_id`. The historical transactions model is retired. Fee
snapshots and ledger events therefore reference orders; this avoids reviving a
second payment system. `seller_profiles.id` is a profile ID, while `user_id` is
the authentication identity. Ownership checks use that distinction.

The database signup diagnostic and rollback smoke test passed. User-supplied
metadata cannot assign an admin role. The hardened signup trigger bounds profile
metadata and preserves the user's email. No production trigger was changed.

An isolated Supabase project, **the-middleman-escrow-preview**
(`vhfskuabgsudbaiqotth`, EU West), was created in the existing organization after
the user selected a separate test project. Creation was quoted at $0/month.
Only schema and bucket configuration were copied: no production accounts,
orders, uploaded files or settings values. Synthetic smoke-test rows rolled back.

Applied there:

- Empty schema bootstrap from `supabase/staging_bootstrap.sql`.
- `20261002172833_escrow_fulfilment_v2.sql`.
- `20261002180420_escrow_compatibility_hardening.sql`.
- `20261002181508_escrow_provider_evidence.sql`.
- Explicit isolated scheduler setup from `supabase/staging_scheduler.sql`.

The schema bootstrap is for a **new empty staging database only**. The old
repository schema files are not an authoritative replay of the deployed
database. Do not run the bootstrap or indiscriminately replay historical
migrations on an existing project. These changes need a separate production
migration review and rollout before any production activation.

## Fee proposal implemented in test mode

All new accounting lines are integer kobo, calculated on the server with
Postgres numeric rounding. The initial version uses the user's proposal:

| Component | Rule |
| --- | --- |
| Buyer service fee | 3% of product price |
| Flat platform fee | USD 1, converted with the order's locked NGN/USD quote |
| Buyer VAT | 7.5% of service fee plus flat fee |
| Seller commission | 10% of product price |
| Seller VAT | 7.5% of commission |
| Seller payout | Product price minus commission and seller VAT |

For a ₦50,000 product and illustrative ₦1,500/USD quote, the server returns
₦53,225 buyer total and ₦44,625 seller payout. Quotes require a source and
timestamp and expire after 24 hours. A manually supplied test quote is supported;
an automated exchange-rate feed is not implemented. Checkout shows the full NGN
breakdown and a server-generated estimated USD total. Bank conversion remains
separate from the locked rate for the platform fee.

`order_fee_snapshots` stores all requested product, buyer fee, USD cents, FX,
flat fee, VAT, commission and payout fields immutably. Actual verified Paystack
`fees` are recorded as a separate immutable gateway-cost ledger event. No
unverified gateway VAT, transfer tax or stamp-duty estimate is treated as an
actual expense. Payout fees still need provider statement reconciliation. Tax
registration, product VAT applicability and escrow regulatory structure remain
business decisions requiring professional confirmation before live use.

Seller payment responses and sale emails expose seller-side price, commission,
VAT and expected payout; buyer fees, references and identities are omitted.

## Listings, checkout and delivery

- Listings can record a GitHub repository URL, exact 40-character preview
  commit and exclusivity. Client submissions cannot approve themselves; relevant
  edits return a listing to review. Sold exclusive content cannot be edited by
  the seller. Admin decisions and evidence are audited.
- Checkout runs a single RPC that locks the gig, rejects self-purchases and
  unapproved sellers/listings, calculates fees and creates an idempotent order.
  Exclusive payment reservations last 30 minutes. Atomic allocation binds the
  sold gig to its order. A late charge conflicting with another reservation is
  quarantined for refund instead of issuing a second delivery.
- Signed Paystack webhooks and authenticated verification both validate
  reference, amount, currency and provider domain. New orders reject gateway
  surcharges beyond the stored buyer total. Existing legacy verification remains
  compatible with the original fee-inclusive amount fix.
- Paid orders receive an initial delivery record with a 48-hour seller deadline.
- Private storage uploads are validated server-side before submission. Software
  repository deliveries require ZIP. Other supported digital delivery types
  are PDF, PNG, JPEG and text.
- ZIP validation reads every entry, rejects `.git` paths (including case and
  trailing-dot variants), traversal, symlinks, encrypted entries, duplicate names,
  common environment/private-key files, divergent local headers and invalid
  CRC/lengths. Limits are 10 MB compressed, 100 MB expanded and 5,000 entries.
  This is not a malware scanner or a guarantee that arbitrary file contents
  contain no secrets. Admin functional review remains necessary.
- A SHA-256 hash is recorded at submission and checked again when serving the
  buyer. Private bucket access is denied to raw client operations. The permissive
  catch-all upload policy discovered in the old schema is removed in staging.
- `/admin/review` enforces the database admin role and verified MFA. Review
  relation handling was corrected, and approval requires evidence notes plus
  validated package metadata. Rejection returns the package for seller edits.
- Buyer downloads use an account-authenticated platform proxy rather than a
  transferable signed download URL. Every authorized serving attempt is logged;
  this does not prove the browser completed the download. Revocation and hash
  are rechecked immediately before serving.

Repo parity is currently an admin attestation against the submitted repository,
commit and preview. The application does not establish a GitHub connection,
independently prove which commit the preview runs, or build with `git archive`.
Commit-pinned automated exports remain future work.

## Lifecycle and deadlines

Existing enum names are reused; no competing delivery enum was introduced.

| Business step | Stored state |
| --- | --- |
| Awaiting seller | delivery `pending_upload`, order `in_escrow` |
| Submitted / under admin review | delivery `pending_review` |
| Changes requested | delivery `needs_seller_edit` |
| Approved and released to buyer | delivery and order `delivered` |
| Buyer accepted / auto-accepted | order `approved`, payout operation queued |
| Buyer dispute | order `disputed`, separate dispute record `open` |
| Resolved | dispute record `resolved`, refund/payout operations as decided |
| Money released | payment escrow `released`, payout `paid`, confirmed ledger event |
| Full refund confirmed | order and payment `refunded`, download access revoked |
| Seller missed submission | delivery `expired`, refund queued |

Seller submission is due in 48 hours; rejected submissions get another 48 hours.
Admin review is due in 24 hours and overdue items appear in the admin dashboard.
Delivery opens a 72-hour buyer window; early acceptance or expiry queues payout.
The old trigger overriding the window to 24 hours was corrected. Seller dispute
responses are due in 24 hours; admin resolution waits for a response or expiry.

A staging-only pg_cron job runs every 15 minutes. It processes eligible deadline
decisions directly in the database, even before HTTP worker secrets are supplied.
It optionally invokes the protected test-gateway worker using Vault secrets.
Until configured, it makes no HTTP or gateway requests. Deadline handling is
bounded to 100 eligible orders per pass; high-volume operation needs capacity
planning. Admin SLA escalation and seller timeout reputation events are currently
dashboard/ledger signals, not external alert integrations or a numeric score.

## Disputes and money controls

Valid grounds are listing mismatch, broken/missing core features and preview/repo
mismatch. Seller responses and admin decisions have separate authenticated
routes. The seller never receives the dispute buyer's identity.

Admin can reject a dispute, refund the full order or choose a product-principal
partial refund in kobo. Partial refunds return buyer fees/VAT in the same
proportion and retain the corresponding proportion of seller payout. Amounts,
reasons and actor are recorded. Three upheld disputes within 90 days produce an
admin-review signal.

Financial tables are inaccessible for client mutation. Accounting events and
fee snapshots reject updates/deletes, and service-role TRUNCATE grants are
removed. Mutable workflow rows remain distinct from the append-only ledger.

Payout/refund operations have stable references, leases and unique order/kind
constraints. Acceptance does not claim money was paid. Provider amount,
recipient, reference, currency, domain and final status are checked before
confirmation. Partial seller payouts wait for refund confirmation. Interrupted
refund requests become `uncertain`; they are never blindly resubmitted. Unknown
outcomes need operator/provider reconciliation; the UI intentionally has no
unsafe resend or manual "mark paid" button. Automated refund lookup without a
known provider ID and a complete operator reconciliation workflow remain work.

Full-refund decisions revoke future buyer downloads before refund submission.
Exclusive products stay sold/unavailable after refunds: downloaded source cannot
be remotely erased. Safe resale needs a separate admin licensing decision; an
automatic `is_sold=false` reset would be misleading and is not implemented.

Gateway execution is Paystack **test mode only**, behind separate isolation and
gateway flags. No live transfers/refunds were made. Flutterwave is not integrated;
there was no existing adapter/configuration to safely exercise it. Live-mode
payments, transfer OTP/approval configuration, payout batching and provider tax
reconciliation require another explicit implementation/activation stage.

## Admin and account security

- `/security`: TOTP enrollment/challenge, password changes and global sign-out.
- Admin pages/APIs require the database admin role, AAL2 and a verified MFA factor.
  Isolated escrow admin access additionally checks the active auth session.
- `/reset-password` and `/auth/callback`: PKCE reset exchange, allowlisted local
  destination and an account-neutral request response.
- Password forms now allow 12–128 characters instead of the old 15-character cap.
- Middleware refreshes protected-page sessions and marks responses private.
- New mutation endpoints check exact origin; service credentials stay server-side.
- Production browser source maps and the powered-by header are disabled.
- `/admin/escrow` adds seller/listing approval, dispute decisions, payout recipient
  assignment, operation status, overdue reviews and admin notification email.
  The actual admin address must be supplied by the owner; none was invented.

Paystack recipient ownership is an admin verification step, not automatic bank
account ownership proof. App role checks do not replace Supabase dashboard IAM.
Admin MFA must be enrolled by the admin personally. Existing public listings and
profiles still expose seller display names/user IDs, and free-text/repo URLs can
identify their authors: order-response pseudonyms alone are not complete platform
anonymity. Message content filtering and bypass prevention were not added.

## Dependencies and verification

Next.js/eslint-config-next upgraded to 15.5.24; Supabase SSR/client versions are
pinned. ZIP handling uses yauzl 3.4.0. Updated sharp, postcss and nanoid overrides
remove the audit findings observed at the start. Production-dependency audit
reports zero vulnerabilities at verification time; this is not a permanent
security guarantee.

29 automated tests pass, including existing payment hardening regressions and
new actual-migration PGlite tests. Lint, TypeScript and optimized build pass.
CI now runs tests and the production dependency audit in addition to existing
lint/type/build checks. The real staging rollback smoke test validates signup,
fee totals, exclusivity, payment replay, submission, the 72-hour window, acceptance,
locked payout recipients, confirmation replay and access grants.

Visual browser verification was attempted but browser installation failed on
certificate/download errors. No authenticated end-to-end browser, real Paystack
test charge, real private-bucket upload or admin MFA enrollment is claimed.
The new preview deployment and CI statuses are reported separately in the handoff.

## Branch-only activation needed

The connected Vercel tools can inspect/deploy but cannot write environment
variables; the Supabase connector does not expose the new project's service
credential. Complete this only for the current Git branch's Preview environment:

1. Set `NEXT_PUBLIC_SUPABASE_URL` to the isolated project URL and supply that
   project's public key as `NEXT_PUBLIC_SUPABASE_ANON_KEY` and server key as
   `SUPABASE_SERVICE_ROLE_KEY`. Do not reuse production keys.
2. Set `MARKETPLACE_ESCROW_V2_ENABLED=true` and
   `MARKETPLACE_ISOLATED_PREVIEW=true`. Both flags and the nonproduction database
   check are required. Vercel Production is always denied by this version.
3. Supply matching `PAYSTACK_SECRET_KEY=sk_test_...` and
   `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...`; new checkout requires both.
4. Set a fresh `ESCROW_FX_NGN_PER_USD`, ISO `ESCROW_FX_QUOTED_AT` and
   `ESCROW_FX_SOURCE`. Configure a test-only mail account/approved test recipients
   before enabling notifications. Set the Paystack test webhook to the preview.
5. Set random server-only `ESCROW_CRON_SECRET` of at least 32 characters. Enable
   `ESCROW_GATEWAY_TEST_ENABLED=true` only when test transfers/refunds are ready.
6. In staging Vault, set `escrow_preview_worker_url` to the specific preview
   `https://<deployment>.vercel.app/api/cron/escrow`,
   `escrow_preview_cron_secret` to the matching bearer secret, and optionally
   `escrow_preview_vercel_bypass` if deployment protection requires it.
7. Allow the preview auth callback in staging Supabase auth redirect settings,
   configure a verified test admin role server-side, enroll TOTP personally, and
   set the intended admin notification email in `/admin/escrow`.
8. Redeploy the branch, then exercise buyer/seller/admin isolation, ZIP upload,
   approve/reject, download integrity, disputes and actual test gateway outcomes.

Without this setup the advanced delivery/review/gateway flows fail closed. Never
turn on these flags against the existing production database. Leaked-password
protection was observed disabled on the existing project and remains unchanged;
enable it during a separately authorized production security rollout.

## Changed-file inventory

See the PR diff for exact hunks. Implementation covers:

- Database: three new escrow migrations, schema-only staging bootstrap, scheduler
  setup and real staging smoke-test script.
- Backend: escrow flags, gateway worker, ZIP validation, admin/session helpers,
  order creation/action/upload/download, fees/payment projection, verification,
  dispute/response/resolution, admin controls and protected cron endpoint.
- UI: checkout fee confirmation, repo provenance form, order delivery/deadlines,
  payment breakdown, seller disputes, admin review/operations, account security,
  reset password and signup/sign-in changes.
- Infrastructure: session middleware, Next configuration, dependency versions and
  lockfile, environment template, CI tests/audit and regression tests.

Outstanding launch work is explicitly recorded above: branch-only credentials
and end-to-end testing, automated repo proof/exports, full public anonymity,
Flutterwave/live payout integration, reconciliation/alerts, live FX, tax/legal
confirmation and a reviewed production rollout.
