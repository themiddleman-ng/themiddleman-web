# The Middleman

The Middleman is a Nigeria-first marketplace for buying and selling digital
products and digital services with clearer seller identity, Naira pricing, and
protected transaction flows.

The product is built around one promise: buyers should be able to discover
something useful and pay without blindly trusting a stranger, while legitimate
sellers should be able to prove who they are and get paid for completed work.

[Visit themiddleman.com.ng](https://themiddleman.com.ng)

## Repository status

This is the official organization repository for the current Next.js
application under active MVP development. Its `main` branch is connected to
the public website.

The application is **not production-ready yet**. Do not point the live domain at
this code until the database schema, payment flow, environment variables, and
deployment build have been verified.

## Product scope

The active product direction is a Nigeria-wide digital marketplace for:

- Software and code
- Templates and design assets
- Digital creative work
- Digital services
- AI-assisted products and services, clearly labelled

The earlier OAU-focused physical-goods concept is retired and is not part of
the current product.

## What exists in the codebase

- Public homepage, marketplace feed, listing details, and informational pages
- Supabase email/password authentication
- Buyer and seller role selection on one account
- Seller onboarding, identity-document upload, and verification states
- Seller listing creation and management
- Buyer orders and delivery/approval states
- Paystack payment initialization/verification integration points
- Buyer-seller conversations and messages
- Reviews, ratings, listing reports, and dispute interfaces
- Responsive navigation and a dedicated mobile tab bar
- Legal-policy routes for terms, privacy, refunds, and marketplace disclaimers

Some of these flows still depend on the live Supabase schema and configured
third-party credentials. Presence in the interface does not mean a flow has
completed production or legal review.

## Technology

- [Next.js](https://nextjs.org/) 15 with the App Router
- React 18
- TypeScript and JavaScript
- Tailwind CSS 4
- Supabase Auth, Postgres, Storage, and Row Level Security
- Paystack integration points for Naira payments
- Vercel hosting and Cloudflare-managed DNS
- pnpm for package management

## Local development

### Requirements

- Node.js 22 (see `.nvmrc`)
- Corepack with pnpm enabled
- A Supabase project for authenticated and database-backed flows

### Setup

```bash
git clone https://github.com/themiddleman-ng/themiddleman-web.git
cd themiddleman-web
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The public pages can render without working Supabase credentials, but account,
listing, messaging, order, and payment features require valid environment
variables.

## Environment variables

Use `.env.example` as the source of truth. Never commit `.env`, `.env.local`,
service-role keys, Paystack secret keys, or other real credentials.

| Variable | Used for | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Browser-safe |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous client | Browser-safe; RLS must remain enabled |
| `SUPABASE_SERVICE_ROLE_KEY` | Trusted server-side Supabase operations | Secret |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack checkout | Browser-safe |
| `PAYSTACK_SECRET_KEY` | Server-side Paystack verification | Secret |
| `NEXT_PUBLIC_APP_URL` | Canonical application URL | Browser-safe |
| `NEXT_PUBLIC_SITE_NAME` | Public product name | Browser-safe |

## Quality checks

Run these before opening or merging a pull request:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Database status

The SQL files under `supabase/` currently describe the known schema and
policies, but they are **not a complete chronological migration history**.
They must not be applied blindly to an existing production project.

Current SQL areas include:

- Core users, seller profiles, listings, orders, payments, reviews, and disputes
- Auth-user provisioning trigger
- Conversations and messages
- Listing reports
- Review and rating functions
- Verification-document storage policies

Before production migration, export the actual live Supabase schema, compare it
with these files, and create ordered, repeatable migrations. Changes to RLS,
payments, verification documents, orders, or disputes require explicit review.

## Main routes

| Area | Routes |
| --- | --- |
| Discovery | `/`, `/marketplace`, `/browse`, `/gigs/[id]` |
| Accounts | `/signup`, `/profile` |
| Seller flow | `/onboarding/role`, `/onboarding/seller`, `/onboarding/pending`, `/gigs/new`, `/gigs/mine` |
| Transactions | `/orders`, `/payments`, `/api/payments/verify` |
| Trust | `/messages`, `/disputes`, `/seller-guidelines` |
| Company and legal | `/about`, `/careers`, `/legal/[document]` |

## Production-readiness priorities

1. Reconcile the repository SQL with the live Supabase project and establish
   ordered migrations.
2. Add and verify the administrative seller-review workflow.
3. Test payment verification, escrow state transitions, refunds, disputes, and
   webhook behaviour end to end.
4. Complete authorization and RLS testing for every buyer/seller boundary.
5. Add automated CI checks and production deployment safeguards.
6. Optimize remaining large media and complete accessibility/performance QA.
7. Obtain appropriate legal review before representing policies as final.

## Contributing and security

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request and
[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before participating.

Do not disclose vulnerabilities in a public issue. Follow
[SECURITY.md](./SECURITY.md) for private reporting instructions.

## License

See [LICENSE](./LICENSE).
