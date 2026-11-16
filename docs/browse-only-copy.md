# Browse-only launch copy

Checkout stays paused. The sentences below are the public wording for that launch. Payment, Paystack, escrow, payout, cron, and dispute code paths are unchanged. `/legal/*` text is unchanged.

## Wording that changed

| Surface | File | Before | After |
| --- | --- | --- | --- |
| Site description, Open Graph, Twitter | `app/layout.tsx` | Review listings and pay in Naira through Paystack. | Purchases are paused, so browsing does not start a payment. |
| Open Graph image | `app/opengraph-image.tsx` | Ready-made products. Pay in naira through Paystack. | Ready-made products. Purchases are paused. |
| Web app manifest | `app/manifest.ts` | Browse digital products and pay in Naira. | Browse digital products. Purchases are paused. |
| Marketplace metadata | `app/marketplace/page.tsx` | Compare details and prices, then pay in Naira through Paystack. | Compare details and prices. Purchases are paused. |
| Homepage hero | `app/page.tsx` | Browse listings and pay through Paystack. | Browse listings. Purchases are paused, so nothing on this site charges you. |
| How it works heading | `app/page.tsx` | Find, pay, then collect your files. | Find a listing, then check back when purchases open. |
| How it works step 2 | `app/page.tsx` | Pay with Paystack (₦). Eligible checkout runs through Paystack. | Purchases paused. Prices are in Naira. Checkout is not open. |
| How it works step 3 | `app/page.tsx` | Your payment is held until you confirm. | Files come later. Nothing to download while purchases are paused. |
| Trust line under step 3 and on the product price | `components/EscrowTrustLine.tsx` | Payment held in escrow until you confirm delivery. | Purchases are paused. No payment is taken or held. |
| Developer strip | `app/page.tsx` | Paystack checkout in Naira. | Prices in Naira. Checkout is not open. |
| Developer strip, messaging | `app/page.tsx` | Keep conversations here after an order starts. | Messages are tied to a paid order. A new buyer cannot open a thread yet. |
| Sell call to action | `app/page.tsx` | List a digital product and get paid in Naira. | List a digital product buyers can preview. |
| Bottom call to action | `app/page.tsx` | Find a product. Pay in Naira. | Find a product. Purchases are paused. |
| Footer | `app/page.tsx` | Payments by Paystack. | Purchases are paused. |
| FAQ intro and five answers | `components/HomeFAQ.tsx` | Live payment flow, Paystack checkout, funds currently held, refund before paying, licence after purchase, download from the order page. | Checkout does not take a payment. Escrow and refund rules are described on the unchanged legal pages for when payments are enabled. |
| About metadata and body | `app/about/page.tsx` | Pay in Naira through Paystack. | Purchases are paused. Browsing does not start a payment. |
| About bullet | `app/about/page.tsx` | Pay in Naira. Checkout is in Naira through Paystack. | Prices in Naira. Checkout is not open. |
| `/about` slug (if that route is hit) | `app/[slug]/page.tsx` | Escrow-backed Naira payments held safely on every order. | Purchases are paused. Browsing does not start a payment. |
| `/disputes` slug | `app/[slug]/page.tsx` | Funds remain protected while we assess the case. | There is no payment to hold. Disputes follow the published policy once payments are enabled. |
| `/seller-guidelines` slug | `app/[slug]/page.tsx` | Mark an order delivered when the work is ready. | Purchases and payouts are paused. A listing is a preview until checkout opens. |
| Signup metadata | `app/signup/page.tsx` | Checkout is in Naira through Paystack. | Signing up does not start a payment. |
| Signup hero and form | `app/signup/PageClient.js` | Pay in Naira through Paystack. Buy digital products. | Purchases are paused. Signing up does not charge you. |
| Payments page intro and step 1 | `app/payments/PageClient.tsx` | Payments are made in Naira through Paystack. Pay in Naira. | Checkout is paused. This page does not start a payment. |
| Product paused control | `app/gigs/[id]/PageClient.tsx` | When checkout opens, payment stays in escrow. Funds released per escrow terms. | Checkout is not open. This page does not take a payment. |
| Product delivery line | `app/gigs/[id]/PageClient.tsx` | Allow N days for the seller to deliver after purchase. | The listing states that window. The clock does not start while purchases are paused. |
| Product requirements empty state | `app/gigs/[id]/PageClient.tsx` | Confirm details before checkout. | Reading the listing does not start a payment. |
| Product message panel | `app/gigs/[id]/PageClient.tsx` | Ask before checkout, or messaging opens once you have a paid order. | A question does not start a payment. A new buyer cannot open a thread while purchases are paused. |
| Orders intro | `app/orders/PageClient.js` | Track and manage your purchases and sales. | Track orders that already exist. This page does not start a payment. |
| Role choice | `app/onboarding/role/PageClient.js` | Buy or sell. Buyer and seller cards imply a live purchase. | Purchases and payouts are paused. Choosing a path does not start a payment. |
| Seller onboarding intro and payout section | `app/onboarding/seller/PageClient.js` | Always says Paystack checks the account name. | Payout checks are off unless the existing payout switch is on. The form does not save a bank account in that case. |
| First-run tours | `components/onboarding/FirstRunExperience.tsx` | Marketplace, orders, profile, payments, and product tours described a live purchase. | Those tours say purchases or checkout are paused and that the page does not charge the visitor. |
| Product file field | `components/ProductPackageUploader.tsx` | Files buyers receive after purchase. | Files a buyer would receive. Purchases are paused. The file stays private until review. |
| Design preview samples | `components/design/DesignPreviewScreen.tsx` | Paid in Naira through Paystack. Pay once live checkout is on. | Sample only. This preview does not charge anyone or create an order. |

## Left unchanged on purpose

| Surface | Why it stays |
| --- | --- |
| `app/legal/[document]/page.tsx` (`terms`, `privacy`, `cookies`, `refunds`, `disputes`, `seller-guidelines`, `disclaimer`) | Legal meaning must not change in this launch. The pages still describe escrow, fees, refunds, and disputes as if payments run. See the lawyer list below. |
| `lib/server/payment-emails.mjs` | Those emails send only after a payment is already recorded. Production checkout cannot record one. Rewriting them to “purchases paused” would make an isolated test-payment email untrue. |
| Product “Buy this product” / “Continue to Paystack” | Rendered only when `purchasesEnabled` is true. That flag is off for this launch. The paused button is the one visitors see. |
| Seller payout fields and “Verification uses Paystack’s bank lookup” | Rendered only when `payoutSetupEnabled` is true. The always-visible sentence above them no longer promises a name check. |
| `/payments` status labels such as “In escrow” | They name a stored row. They do not start a charge. The page intro now says checkout is paused. |
| `/orders` status labels and “Retry payment verification” | Those controls act on an order that already exists. The intro says new purchases are paused. |
| `app/api/orders/route.ts` paused error | Already says purchases are paused. Payment logic was not edited. |
| Admin escrow screens | Operator tools behind admin access. Not the public browse-only promise. |
| `/careers` slug | “Build trust into every transaction” does not say a visitor can pay. |

## Legal pages that need a lawyer before payments go live

Do not treat the current legal text as cleared for taking money. A lawyer should read these against the real Paystack and escrow behaviour before checkout is enabled.

| Page | Why |
| --- | --- |
| `/legal/terms` | Says the platform is an intermediary and escrow agent, that every payment is deducted and held, that funds release only after approval, expiry, or a seller-favouring dispute, and that funds may be held 14 days after approval. It also sets commission “displayed at checkout”, automatic delivery approval after 72 hours, and a final decision on escrow release. Those duties do not match a paused checkout, and they need a Nigerian regulatory check before any customer funds move. |
| `/legal/refunds` | Promises a full return within 3 business days for non-delivery, proportional partial refunds, a strike system, chargeback suspension, and refunds to the original method in 3–5 business days. That has to match what Paystack and the escrow functions actually do. A partial refund does not create its own order status. |
| `/legal/privacy` | Says data is processed to facilitate escrow, that government ID is collected, that payment processors receive data, and that transaction records are kept for 7 years under Nigerian financial rules, citing NDPR 2019 and the Nigeria Data Protection Act 2023. A lawyer should confirm the named processor, the retention periods, and the cross-border wording before payments start. |
| `/legal/disclaimer` | Says the platform “operates escrow services under applicable Nigerian regulations” while also saying it is not a licensed financial institution. That regulatory claim needs a lawyer before money moves. The page also tells buyers to ask questions before purchasing. |
| `/legal/disputes` | Sets a 72-hour window, a 7-business-day mediation timeline, binding outcomes including full and partial refunds, one escalation, and forfeiture of pending escrow funds for bad faith. It has to match the dispute code that would run once payments exist. |
| `/legal/seller-guidelines` | Sets approval timing, commission deducted from payout, “listed price is what the buyer pays”, strike penalties, and a 30-day hold of pending escrow funds. The checkout screen calculates a service fee, a flat platform fee, and VAT. A lawyer should reconcile that with the guidelines before sellers are paid. |
| `/legal/cookies` | Lower urgency. It mentions checkout as an account feature that can break if essential cookies are blocked. It does not create a fund-holding duty. A lawyer should still read it when the other pages are updated so it does not imply checkout is already available. |
