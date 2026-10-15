# Middleman design implementation

The existing Next.js application is retained. No API route, database migration, checkout permission, financial gate, or server-side admin authorisation was changed.

## What changed

- Responsive screen styling, account/creator/admin navigation rails, distinct marketplace, correspondence, profile, operational and legal layouts. The landing page is excluded.
- Sign-in/signup split layout, original approved logo, orange raster wave background with peach and restrained blue divider, panel-side transition, very subtle background movement and reduced-motion support.
- Marketplace category and price filtering, sorting, mobile filter disclosure, two-column mobile/three-column desktop listing cards. Actual catalogue data is retained.
- Conversation search, quieter sent-message styling and desktop conversation details. Existing realtime messaging, validation and send actions are retained.
- Profile fields, save/cancel feedback, private photo upload/removal and existing recent-order/seller sections. Name/state use the existing users table; display name, phone and bio use the existing account metadata API. Seller listing identity remains separate.
- Order search/status/role filters and status-based progress; original delivery, payment verification, dispute, download and review controls remain gated by their existing logic.
- Seller listing search/status filtering; pause/resume/delete still use existing actions, now with mutation failure feedback.
- Analytics product comparison and CSV export use real loaded totals. No invented daily revenue series. Payments search/export and gross account totals use existing payment records.
- Admin order-distribution presentation uses the existing latest-200-order query. No admin data is exposed through a frontend bypass.
- Legal contents navigation retains the actual policy text. Browse category tiles retain the original taxonomy.
- Explicit Buy and sell onboarding button and Orders mobile navigation. Browse and List a product remain accessible.

## Tours

The welcome choice is stored per signed-in user. New users who opt in receive a separate tour on each supported page, once. Completed or dismissed pages are terminal; other pages remain available. Product detail tours are shared across listings. Close, Escape, keyboard focus containment, Settings replay and cross-tab completion are supported.

The versioned local cache is backed by existing Supabase account metadata (`middleman_page_tours`). Existing `user_onboarding_preferences` rows are honoured and updated for compatibility. No new table or migration is needed. Cross-device persistence requires the existing authenticated Supabase connection; browser-only completion remains available if that write fails.

## Preserved branding and behaviour

`components/Logo.tsx` and every file in `public/brand` are unchanged. The only SiteHeader edit replaces an invalid nested link wrapper with a div and gives the existing Logo link the original marketplace destination. Header styling, navigation actions, account menu, notifications and logo rendering are preserved.

The development-only `/design-review` page embeds the actual routes at 1440×1024 and 390×844 for visual inspection. It returns 404 in production. Development allows same-origin frames for this review; production keeps `X-Frame-Options: DENY`.

## Verification limit

This checkout has no local Supabase environment configuration or signed-in test account. Catalogue-populated and authenticated buyer/seller/admin screens therefore cannot receive final visual approval here. Screens currently have a mix of detailed route updates and shared presentation changes; this is not a certified pixel-for-pixel implementation of all generated boards. Mock-only capabilities with no existing API (for example a true daily analytics series) have not been represented as live data. See `design-qa.md` for the remaining gate.
