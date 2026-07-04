# Security Policy

The Middleman handles user accounts, listings, in-app messaging, and
(from Phase 4 onward) payments. We take security and data protection
seriously, and we appreciate responsible disclosure from anyone who finds
an issue.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**
Public disclosure before a fix is deployed puts users at risk.

Instead, email: **hello@themiddleman.com.ng**

Include, where possible:
- A description of the vulnerability and its potential impact
- Steps to reproduce it
- Any relevant logs, screenshots, or proof-of-concept code
- Your contact info, if you'd like credit or follow-up

## What to expect

- We'll acknowledge your report as soon as possible.
- We'll investigate and, if confirmed, work on a fix as a priority —
  especially for anything touching authentication, Row-Level Security
  policies, or payment flows.
- We'll let you know once it's resolved, and are happy to credit
  responsible reporters (with permission) once a fix ships.

## Scope

This applies to:
- The Middleman web app (themiddleman.com.ng)
- The Middleman's Supabase backend (auth, RLS policies, Edge Functions)
- Associated APIs

Out of scope: third-party services we integrate with (e.g. Supabase's own
infrastructure, Paystack, Vercel) — please report those directly to the
respective provider.

## Data Handling

The Middleman is built on an NDPR-compliant foundation. If your report
involves actual exposure of user data (not just a theoretical vulnerability),
please flag this explicitly in your email so we can prioritize accordingly.

Thank you for helping keep The Middleman and its users safe.
