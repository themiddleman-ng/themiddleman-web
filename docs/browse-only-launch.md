# Browse-only launch readiness

## Current behaviour (checkout paused)

Production and most previews keep checkout disabled via `gatewayTestEnabled()` (requires isolated Supabase, Paystack **test** keys, and `ESCROW_GATEWAY_TEST_ENABLED=true`). Users can still browse listings, sign up, complete seller onboarding, and wishlist products.

## Messaging gap (default)

`POST /api/conversations` returns **403** unless the buyer has a paid order (`in_escrow`, `delivered`, `approved`, or `disputed`) for that product. With checkout paused, new buyers cannot pay, so **they cannot start product conversations** unless the optional flag below is enabled.

## Optional pre-purchase enquiry

Set `MARKETPLACE_PRE_PURCHASE_ENQUIRY_ENABLED=true` on a preview or local environment to allow signed-in buyers to open a conversation before payment. Default (unset or any other value) keeps the paid-order requirement.

## Manual verification checklist (local / isolated only)

Never run these steps against the production Supabase project (`uwigyojtiudefnwjezhm.supabase.co`).

1. `supabase start` (or mocked Supabase URL in `.env.local`).
2. Apply migrations in order (see root agent report).
3. Sign up a buyer and a seller; complete seller onboarding to `approved`.
4. Publish an `active` gig as the seller.
5. Browse marketplace and open the gig while checkout remains paused (button shows “Purchases paused”).
6. Attempt messaging: expect 403 until `MARKETPLACE_PRE_PURCHASE_ENQUIRY_ENABLED=true`, then conversation creation should succeed.

## Vercel environment variables (names only)

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Required** | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Required** | Browser / SSR anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required** | Server routes, admin, messaging |
| `NEXT_PUBLIC_APP_URL` | Optional | Canonical links in emails |
| `NEXT_PUBLIC_SITE_URL` | Optional | Account deletion return URL fallback |
| `RESEND_API_KEY` | Optional | Transactional email (sign-up flows degrade without it) |
| `RESEND_FROM_EMAIL` | Optional | Sender address for Resend |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Optional | Checkout (test `pk_test_…` only when gateway test enabled) |
| `PAYSTACK_SECRET_KEY` | Optional | Payments webhook / verify (test `sk_test_…` for isolated checkout) |
| `MARKETPLACE_ISOLATED_PREVIEW` | Optional | Must be `true` for escrow v2 / gateway test on non-prod DB |
| `MARKETPLACE_ESCROW_V2_ENABLED` | Optional | Escrow v2 writes on isolated preview |
| `ESCROW_GATEWAY_TEST_ENABLED` | Optional | Enables test checkout when combined with test Paystack keys |
| `ESCROW_CRON_SECRET` | Optional | Protects `/api/cron/escrow` |
| `ESCROW_FX_NGN_PER_USD` | Optional | FX snapshot for isolated checkout fees |
| `ESCROW_FX_QUOTED_AT` | Optional | FX metadata |
| `ESCROW_FX_SOURCE` | Optional | FX metadata |
| `MARKETPLACE_ANALYTICS_PEPPER` | Optional | Enables seller analytics tracking (≥32 chars) |
| `MARKETPLACE_PRODUCT_PACKAGES_ENABLED` | Optional | Product package admin path (isolated) |
| `NEXT_PUBLIC_MARKETPLACE_PRODUCT_PACKAGES_ENABLED` | Optional | Client flag for packages |
| `MARKETPLACE_PRE_PURCHASE_ENQUIRY_ENABLED` | Optional | `true` allows messaging before paid order |
| `VERCEL_ENV` | Set by Vercel | Used to block production gateway test |
