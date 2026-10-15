# The Middleman — production preparation review

Date: 15 October 2026
Branch: `fix/production-readiness`
Based on: `feat/product-first-homepage` at `1559c5f`

## Release decision

**Hold production release.** This change prepares a reviewable application branch. No production deployment, domain change, live payment, production database migration, or catalogue write was performed. This is a substantial repair pass, not a claim that every possible bug has been eliminated.

## Changes implemented

### Mobile and visual experience

- Fixed the shared header's nested logo links, which produced hydration errors across application pages.
- Reused the account-menu header on the homepage, removing the crowded login/browse controls on small screens.
- Contained the decorative hero glow so the page no longer scrolls horizontally on phones.
- Reduced the oversized hero heading and replaced prominent blue buttons, links and section surfaces with warm neutral and orange treatments. Navy remains in typography, the logo and selected mockup details.
- Added short entrance transitions and press feedback without introducing an animation library. Reduced-motion preferences disable animation throughout the application.
- Added global focus indicators, larger mobile category targets and 16px form fields to avoid input zoom on phones.
- Added safe-area viewport support and an opaque safe-area background beneath the mobile tab bar.
- Extended the tab bar to notifications, analytics, disputes and seller support.
- Added account-menu dismissal on outside click and Escape, with focus returned to its button after Escape. Used normal navigation semantics rather than incomplete ARIA menu semantics.
- Added shared loading and recoverable page-error states. Payment-related error guidance directs buyers to check orders before paying again.

### Catalogue and listing previews

- Replaced generic placeholder artwork with code-rendered, responsive concept mockups: dashboards, landing pages, mobile screens, brand kits, content calendars, copy documents and workflow diagrams.
- Applied appropriate mockups to all eight existing listing titles when no seller image is available. Real uploaded images continue to take precedence.
- Labelled illustrative covers explicitly so buyers can distinguish concept artwork from an actual seller preview.
- Fixed the homepage feed that excluded every listing without a cover image, leaving all eight current listings invisible there.
- Added homepage feed handling for missing configuration and rejected network requests.
- Added `/design-preview` for preview/development environments. It is unavailable in a production environment and carries noindex metadata.
- Prepared four additional unpublished product proposals with descriptions, deliverables and indicative Naira prices in `fixtures/catalogue-review.json`: an invoice/income tracker, portfolio starter, social launch kit and support reply library. These are review drafts, not fulfilled products or new live seller listings.

### Marketplace discovery

- Added newest and ascending/descending price sorting.
- Included listing descriptions in text search.
- Made category changes update the URL and respond to URL navigation.
- Added a visible result count and a clear-filters action.
- Removed environment implementation details from the network error shown to shoppers.

### Messaging repairs

- Corrected a verified schema mismatch: conversations store the seller's user ID, while orders and gigs store the seller-profile ID. List, create and message-access handlers now resolve those identities correctly.
- Corrected PostgREST to-one relationship handling, retaining compatibility with legacy array-shaped fixtures.
- Retained the paid-order requirement and independent participant checks for each request.
- Changed message fetching to return the latest 200 messages in chronological display order, rather than permanently stopping at the first 200.
- Added an in-flight send lock and disabled repeated sends while a message is being submitted.
- Preserved drafts after failed sends, handled load/refresh failures and cleared the previous thread when switching conversations.
- Changed the outgoing bubble surface from a large navy fill to a warm neutral treatment.

### Payment recovery

- Added a retry-verification action after a Paystack callback cannot be confirmed. This retries server verification for the existing reference instead of opening another payment.
- Added a direct My Orders link and clear guidance not to pay again while verification is pending.
- Disabled additional checkout opening while the current checkout or verification is active.
- Kept the order-creation idempotency key when closing and reopening the checkout on the same mounted product page.
- Removed environment-variable setup instructions from the shopper-facing payment error.
- Preserved isolated test-mode checkout gates, server-controlled pricing and existing payment/webhook validation.

### Database preparation and access boundaries

Prepared `20261015074336_enforce_listing_review.sql`; it is **not applied to production**.

- Changes the default listing state to `pending_review`.
- Blocks browser roles from directly publishing or restoring deleted listings.
- Prevents browser changes to listing ownership.
- Returns edited public listing/package data to review.
- Preserves trusted server review operations.
- Adds the draft, changes-requested and rejected states expected by the package review code.
- Revokes browser hard deletion so archived products retain transactional references.
- Updates the seller dashboard to submit paused products for review and report failed/zero-row changes.
- Expands session-refresh middleware coverage to API and other account routes.
- Expands noindex coverage for account, settings, notifications, analytics, disputes and seller-support pages; excludes internal routes from crawler access in robots.txt.

### Dependencies and configuration

- Next.js and eslint-config-next: `15.5.24` → `15.5.27`.
- Sharp override: `0.35.4` → `0.35.5`.
- Added the `source-map-js` `1.2.2` override and regenerated the pnpm lockfile.
- The production dependency audit now reports **No known vulnerabilities found**.
- Added the missing product-package switches, analytics pepper placeholder and canonical site URL to `.env.example`; no credentials were committed.
- Fixed signup/login mode restoration so localStorage cannot change the initial client HTML before hydration. Explicit signin/signup URLs retain precedence and the last-used preference is restored after hydration.

## Validation and its limits

- ESLint: passed.
- TypeScript: validated by the production build.
- Application/security/database test suite: **42 passed, 0 failed**. Includes new tests for review enforcement, seller identity mapping, paid-conversation access and outsider denial.
- Production dependency audit: clean.
- Production build: passed; final repeat after browser-discovered repairs is recorded with the review evidence.
- Browser scope: 35 routes at 360px, 390px and 1440px; 105 route/viewport combinations. Results and screenshots are under `docs/review/`.
- Browser runs use an environment without live Supabase credentials. They verify rendering, hydration, overflow, account-menu dismissal, category URL state and reduced-motion behavior. They do not prove authenticated account mutations, live catalogue requests or real payment processing.
- New listing-review SQL passes local PGlite behavior tests. A transaction on the isolated hosted project confirmed that the expanded status constraint is compatible with its existing rows, and rolled back. The full migration still needs a reviewed, persistent staging application.

## Database findings that still block launch

Read-only inspection identified eight active production listings without cover images. Their titles still describe service-style work; they need real product packages and seller-reviewed deliverables before being sold as ready-made products.

The isolated preview project lacks the checked product-version, onboarding-preference, payout-verification-attempt and marketplace-events tables. Install and verify the relevant migrations there in order before enabling their feature flags. Do not substitute the old `schema.sql` for the hosted baseline.

The production advisors reported disabled leaked-password protection. They also flagged executable SECURITY DEFINER rating/conversation helpers and RLS-enabled server-only tables without policies. Those findings require intent/authorization review; blanket public policies or revoking necessary public rating access would be inappropriate. References:

- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

## Remaining launch verification

1. Apply and verify the pending migrations on the isolated database, regenerate schema types and rerun RLS/storage checks.
2. Verify signup, confirmation, signin, MFA, seller onboarding, avatar upload, tutorial preferences and account deletion using controlled test accounts.
3. Upload real product packages, review them as an MFA-verified administrator and confirm seller/buyer download permissions.
4. Complete a real Paystack test-mode purchase, duplicate callback/webhook replay, delivery, acceptance, dispute, refund and settlement checks. Confirm receipt emails and retry behavior with the actual provider.
5. Test signed-in buyer and seller mobile flows on physical devices and a slow connection, including keyboard interaction and file uploads. The browser evidence here covers unauthenticated rendering only.
6. Review the existing main/integration-branch divergence, current hosting/domain routing, and CodeHype badge verification before any eventual production merge.

Checkout remains paused outside the existing isolated test gates. No promise of live escrow or payment readiness is made by this review.

## Follow-up: design rules and richer motion

Applied after the initial repair commit, with explicit authorization to push the review branch to the official repository.

| Design principle | Implementation |
| --- | --- |
| Smart defaults | Seller category starts at Web & Software; the existing seven-day delivery default remains editable. Catalogue defaults stay All / Newest. Prices, personal identity and consent are not invented. |
| Goal progress | Listing preparation starts with the real “Draft opened” action checked, then advances when the description, price/delivery, real preview and optional required package are present. Publication review is explicitly separate. |
| Value before signup | Visitors can browse details, use previews, save products and compare a shortlist without authentication. |
| Ownership | Visitors curate up to four products, stored in their browser and restored after returning. Nothing is posted to an account or database. |
| Loss framing | Copy encourages keeping useful picks for a later visit. It makes no invented scarcity, expiry or loss claims; there is no upgrade offer to frame. |
| Price contrast | The shortlist compares actual saved prices as a range and asks buyers to compare included files and requirements too. Checkout remains the authority for current price and fees. |

Additional animation includes scroll-triggered section entrances, staggered catalogue cards, growing preview charts, expanding shortlist/account panels, animated save controls, progress-bar transitions, CTA elevation and preview hover details. These use browser animation/CSS APIs without a new animation dependency. Content remains visible when animation scripting is unavailable. Device reduced-motion preferences retain their own accessible behavior; full default motion is enabled for everyone else.

Shortlist controls are separate from product links, avoiding nested interactive elements. Storage failures retain picks for the current visit and display an accurate notice. Saved entries are limited to four public product references; unpublished proposals cannot be saved as live products.

Follow-up validation: the production build passes. All 105 route/viewport checks again report zero detected rendering, hydration or horizontal-overflow issues. Browser interactions confirm shortlist price comparison, saved choices after reload, listing progress advancing from 25% to 50% after describing the product, category navigation, Escape menu dismissal and reduced-motion support. The earlier 42 application/security tests remain unchanged by this UI-only follow-up.
