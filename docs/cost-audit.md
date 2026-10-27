# External services cost audit (zero-budget constraint)

Audit date: 25 Oct 2026. All dependencies are from `package.json`; infrastructure is inferred from code env usage.

## Services in use

| Service | Role in repo | Free tier (current) | Likely first limit |
| --- | --- | --- | --- |
| **Supabase** | Auth, Postgres, Storage, Realtime (typing) | 2 active projects, both free: production `uwigyojtiudefnwjezhm` and escrow preview `vhfskuabgsudbaiqotth`. 500 MB DB; 1 GB storage; 5 GB egress; 50k MAU ([pricing](https://supabase.com/pricing), [billing quotas](https://supabase.com/docs/guides/platform/billing-on-supabase)) | **Project auto-pause** after ~7 days low DB activity on Free ([pausing guide](https://supabase.com/docs/guides/platform/free-project-pausing)) |
| **Resend** | Transactional email (`RESEND_API_KEY`) | 3,000 emails/month, **100 emails/day** UTC ([pricing](https://resend.com/pricing), [quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits)) | **Daily 100-email cap** during sign-up / payment spikes |
| **Vercel** | Hosting / previews | Hobby: 100 GB Fast Data Transfer, 1M function invocations, etc. ([Hobby plan](https://vercel.com/docs/plans/hobby)) | **Commercial-use restriction** — marketplace checkout may require Pro ([fair use](https://vercel.com/docs/limits/fair-use-guidelines), [Terms §4 Hobby](https://vercel.com/legal/terms)) |
| **Paystack** | Payments, transfers, payouts | No monthly platform fee; per-txn **1.5% + ₦100** (₦100 waived &lt;₦2,500, cap ₦2,000) ([pricing](https://paystack.com/pricing), [txn pricing](https://support.paystack.com/en/articles/2130306)); transfers ₦10–₦50 + ₦50 stamp duty ≥₦10k ([transfers](https://support.paystack.com/en/articles/2132866), [stamp duty](https://support.paystack.com/en/articles/7573314)) | **Per-success transaction fees** (not optional once live) |
| **GitHub** | Source | Free for public/private repos | Unlikely first bottleneck |

## npm dependencies (paid risk)

All runtime deps are open-source (`next`, `react`, `@supabase/*`, `@phosphor-icons/react`, `yauzl`). **No paid npm packages** detected. Dev-only: `playwright`, `@electric-sql/pglite` (free).

## Headline

**Most likely free-tier breaker for a quiet founder deployment: Supabase Free project pausing** due to low database activity, followed by **Resend’s 100 emails/day** cap if auth or payment emails spike. **Vercel Hobby is not aligned with commercial marketplace use** once real payments run — budget for Pro before launch, or accept policy risk.

## Zero-cost guardrails already in code

- Checkout disabled in production via `gatewayTestEnabled()` / escrow v2 host checks.
- Agent work must not add paid SaaS dependencies.
