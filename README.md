# The Middleman

**Proximity-first, trust-focused marketplace — launching at OAU, built to scale nationally.**

The Middleman replaces informal WhatsApp commerce groups with a structured,
verified, campus-first marketplace. Students and local sellers list goods
(with services and jobs coming in later phases), buyers browse by campus
zone, and every transaction runs through in-app chat with manual
verification and escrow protection.

🔗 **Live waitlist:** [themiddleman.com.ng](https://themiddleman.com.ng)
📧 **Contact:** hello@themiddleman.com.ng
💬 **Team Discord:** _(invite link in team onboarding pack)_

---

## Status

🚧 **Active development — Phase 1 (Auth + RLS + Profiles / MVP)**

See the Project Bible (internal doc) for the full six-phase roadmap:

| Phase | Focus |
|---|---|
| 1 | Auth, Row-Level Security, Profiles (MVP) |
| 2 | Marketplace Feed, Listings, AI-assisted growth |
| 3 | Real-time Order Engine + Runner Dispatch |
| 4 | Payments (Paystack/Stripe), Make-an-Offer negotiation |
| 5 | MiddleReel scaling (Cloudflare Stream, algorithmic feed) |
| 6 | MiddleWallet (Ajo/esusu cooperative savings model) |

---

## Tech Stack

- **Frontend:** Next.js + Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Row-Level Security, Realtime, Edge Functions)
- **Hosting:** Vercel (frontend) + Cloudflare (DNS/email routing)
- **AI:** Gemini 1.5 Flash (Smart Listing Assistant — photo → auto-generated listing)
- **Payments (Phase 4+):** Paystack / Stripe
- **Infra philosophy:** Free-tier-first. No AWS. No surprise billing.

---

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm
- A Supabase account (ask a maintainer for project access, or spin up your own project for local dev)

### Setup

```bash
# Clone the repo
git clone https://github.com/<org-name>/themiddleman.git
cd themiddleman

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase URL/keys and other values — see .env.example for details

# Run the dev server
npm run dev
```

App will be running at `http://localhost:3000`.

### Environment Variables

See [`.env.example`](./.env.example) for the full list of required variables.
Never commit `.env.local` or any file containing real secrets — it's already
covered by `.gitignore`.

---

## Project Structure

```
themiddleman/
├── app/                 # Next.js app router pages/routes
├── components/          # Reusable UI components
├── lib/                 # Supabase client, helpers, utilities
├── public/               # Static assets
├── styles/               # Global Tailwind config/styles
├── supabase/             # Migrations, Edge Functions, RLS policies
├── .env.example
├── LICENSE
├── README.md
└── package.json
```

_(Adjust this section as the actual folder structure solidifies.)_

---

## Contributing

The Middleman is built by a small core team plus volunteers. If you've been
onboarded to the team:

1. Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) for branch naming, PR process, and code style.
2. Check the Volunteer Onboarding Pack for context on current priorities.
3. Coordinate via Discord before starting work on a new feature, to avoid duplicate effort.

Not on the team yet? Reach out at hello@themiddleman.com.ng.

---

## Security

Found a vulnerability or a data-exposure risk? Please **do not open a public issue.**
See [`SECURITY.md`](./SECURITY.md) for responsible disclosure instructions.

---

## License

This project is proprietary — see [`LICENSE`](./LICENSE) for terms.
All rights reserved © The Middleman.
