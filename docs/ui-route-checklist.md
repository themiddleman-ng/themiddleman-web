# Route checklist (7 Nov 2026)

Default theme is still dark. A later local pass retook the white comparison with a #FFFFFF page background after listings finished loading. That injection is not a shipped theme. Unopened routes below stay incomplete.

Reviewed in the browser this pass: `/`, `/marketplace`, `/gigs/preview-invoice-tracker`, `/design-review?screen=admin` (sample fixture, labeled as preview data). Dark and white, 1440 and 390.

HTTP status only, not a visual review: `/browse`, `/signup`, `/about`, `/careers`, `/legal/terms`, `/notifications`, `/orders`, `/messages`, `/profile`, `/payments`, `/security`, `/gigs/new`, `/gigs/mine`, `/analytics`, `/disputes`, `/seller-support`, `/onboarding/role`, `/reset-password`, `/account/delete` returned 200 from the local server with no Supabase session. `/admin` redirected to sign-in. `/sellers/sample` returned 404. `/gigs/not-a-real-product` returned 200 HTML; the metadata title is "Product unavailable".

Not opened in a browser this pass: admin operations pages (`/admin/products`, `/admin/sellers`, `/admin/review`, `/admin/escrow`, `/admin/communications`, `/admin/email-preview`), `/onboarding/pending`, `/onboarding/seller`, `/seller-guidelines`, slug pages other than the ones above.

Concrete issues seen, not a redesign list:

- Gig detail first paint is a large empty skeleton before the fixture loads.
- Settings still uses a light cream page inside the dark theme (`#f7f3ec`), so it does not match the rest of the dark UI.
- The design-preview admin screen shows sample counts. It is labeled preview data. It is not the live admin app.
- Whole-site spacing, type, and empty states on the unvisited routes are still open. This pass did not restyle them.
