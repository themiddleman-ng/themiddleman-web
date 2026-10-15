# Design QA — The Middleman

final result: blocked

## Current review walkthrough

The development and Vercel Preview builds now expose `/design-review?screen=...` with 22 selectable screen examples. It is explicitly labeled as sample content, includes the approved `SiteHeader`, and does not change real account permissions or call write endpoints. The marketplace uses a preview-only sample catalogue when Supabase is unavailable; real and production catalogues still use the existing data source. Product cards in the sample catalogue lead to the sample product-detail screen.

The admin overview was visually checked at desktop size after adding this walkthrough. The queue, metrics, admin navigation, recent activity, and sample-data notice are visible. The order filter and local message composer were also exercised in the preview. Automated checks pass, and the build completes. This route makes the missing pages accessible for review; it does **not** establish pixel-exact fidelity for every generated board. Generic account subpages and populated data-backed screens still need route-by-route comparison against the corresponding references.

## Target and scope

Recreate the generated desktop/mobile boards while preserving the repository's approved logo, existing header appearance, page content, actions and backend permissions. Exact branding and existing controls take precedence over differences invented by image generation. The landing page is excluded.

References inspected: desktop sign-in (`exec-130dc8c4-791b-4161-8548-c97387213a6a.png`), marketplace (`exec-8b06b7e0-28d8-4080-bb30-2f7af53fcee3.png`), profile (`exec-93ff28d6-90d8-4170-930a-9e972b0d4e80.png`) and orders (`exec-cfba037a-7975-4c05-81fd-6790a3625d88.png`), from the conversation's generated-image set.

## Evidence

Browser inspection used actual Next.js routes, including a development-only responsive review with 1440×1024 desktop and 390×844 mobile frames. `docs/design-review/auth-responsive.jpg` captures the revised sign-in composition. The latest source image and the browser capture were inspected before this report.

## Comparison history

1. Initial auth implementation had a rectangular division, a small horizontal logo and different hero copy. Revised to the original approved vertical logo, source headline, raster S-divider with peach/blue layers and responsive header treatment. Rechecked desktop and mobile in browser.
2. Marketplace review exposed a pre-existing nested anchor in SiteHeader, producing a React hydration mismatch. Corrected only the wrapper/link destination, preserving the visual header and logo. Post-fix recheck pending final browser cycle.
3. Mobile marketplace toolbar crowded its labels. Added wrapping, constrained sorting width and kept the filter disclosure reachable. Filter opening, price selection and sort selection were exercised in browser. The catalogue is unavailable without environment configuration, so result-order correctness with live inventory remains unverified.

## Required fidelity surfaces

- Typography: hierarchy and scale updated toward the boards; existing local/system font stack retained. Exact generated font matching is not certified.
- Spacing/layout: responsive auth split/stack, marketplace filters/grid, account rails and route-specific panels implemented. Auth switch and all signup fields were inspected. Populated private-route density and overflow are unverified.
- Colours/tokens: orange/white retained; restrained blue accent, cool neutral panels and darker readable primary controls. Header styling retained. Reduced-motion CSS disables new transitions/animation.
- Image quality: approved brand assets unchanged; a separate raster wave is used decoratively. Actual seller images/avatars are retained. Generated mock products are not inserted as live listings.
- Copy/content: actual policies, validation, feature-gate explanations and existing action labels retained. Added honest empty/error states instead of invented live figures.
- Interaction/accessibility: frontend filters/search/sorting, buy-and-sell selection, exports, metadata preferences, focus outlines, tour close/Escape/focus handling and replay are implemented. Live authenticated interactions remain unverified.

## Outstanding P1/P2 gate

- P1: No configured local Supabase connection or signed-in buyer/seller/admin test state. Cannot capture populated orders, messages, profile, analytics or admin screens against the matching mockups. No auth bypass was added.
- P1: The full screen set has not received a route-by-route visual comparison. Several routes receive the shared presentation layer rather than a complete structural reconstruction. Do not describe the whole website as an exact replica.
- P2: Existing header/navigation, extra required fields, real product imagery and actual available data differ from generated samples. These differences must be reviewed in the configured environment, preserving user-required functionality.
- P2: Cross-device tour completion, profile writes, actual CSV data and server-backed actions need verification with authenticated test accounts. Unit tests verify state merge/terminal flags and CSV escaping, not those live services.

## Checks

- Existing regression suite plus new tour/CSV tests: 41 passed, 0 failed.
- TypeScript: passed.
- Targeted ESLint: passed.
- Production build: passed (`next build`), including lint and type validation. Missing local Supabase configuration is reported by the existing client.
- Logo component and approved master PNG: unchanged SHA-256 versus the starting checkout.

No final all-page visual approval is issued. Preserve the work for review; do not claim the exact-replica gate has passed.
