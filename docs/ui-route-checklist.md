# Route checklist (7 Nov 2026)

Dark stays the default. A saved choice in `mm-appearance` wins. With no saved choice, the page follows the device. Light sets the page background to #FFFFFF. The header sun/moon button and the account-menu choices (Light, Dark, Match this device) are the reachable controls. Settings includes the same choices after sign-in.

Reviewed in the browser this pass, dark and light, desktop and mobile where noted: `/`, `/marketplace`, `/gigs/preview-hello-world`, `/signup?mode=signin`, `/design-review?screen=admin` (sample fixture, labeled as preview data). `/settings` was opened signed out and stayed on “Loading your settings…” because there is no account session. `/gigs/preview-invoice-tracker` was checked for its distinct share link.

HTTP status only, not a visual review: `/browse`, `/signup`, `/about`, `/careers`, `/legal/terms`, `/notifications`, `/orders`, `/messages`, `/profile`, `/payments`, `/security`, `/gigs/new`, `/gigs/mine`, `/analytics`, `/disputes`, `/seller-support`, `/onboarding/role`, `/reset-password`, `/account/delete` returned 200 from the local server with no Supabase session. `/admin` redirected to sign-in. `/sellers/sample` returned 404. `/gigs/not-a-real-product` returned 200 HTML; the metadata title is "Product unavailable".

Not opened in a browser this pass: admin operations pages (`/admin/products`, `/admin/sellers`, `/admin/review`, `/admin/escrow`, `/admin/communications`, `/admin/email-preview`), `/onboarding/pending`, `/onboarding/seller`, `/seller-guidelines`, slug pages other than the ones above.

Concrete issues seen, not a redesign list:

- Gig detail first paint is a large empty skeleton before the fixture loads.
- Signed-out settings does not render the account form. The appearance choices are in the account menu, and again on settings after sign-in.
- The design-preview admin screen shows sample counts. It is labeled preview data. It is not the live admin app.
- Whole-site spacing, type, and empty states on the unvisited routes are still open. This pass did not restyle them.
