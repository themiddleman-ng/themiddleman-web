# Contributing to The Middleman

Thanks for helping build this. This doc covers how we work day-to-day so
changes land cleanly and nobody steps on anyone else's work.

## Before you start

- Read the README, open issues, and active pull requests before starting.
- Confirm the task and repository with a maintainer when the same work may
  already be in progress elsewhere.

## Branching

- Do not push directly to `main`; use a pull request.
- Use descriptive branch names such as `feat/listing-search`,
  `fix/payment-verification`, or `docs/setup-guide`.
- Keep branches scoped to one feature or fix. Large, multi-purpose branches are
  hard to review and hard to revert if something breaks.

## Commits

- Write commit messages that explain *why*, not just *what*
  (e.g. `fix: correct RLS policy blocking sellers from editing own listings`
  rather than `fix bug`).
- Small, frequent commits over large infrequent ones.

## Pull Requests

1. Open a PR against `main` once your branch is ready for review.
2. Include a short description: what changed, why, and how to test it.
3. Link the related task/issue if one exists.
4. Tag a maintainer for review — don't merge your own PR without a second pair of eyes,
   even for small changes. Two-person review catches RLS/security mistakes especially.
5. Squash-merge once approved, to keep `main`'s history readable.

## Code Style

- Follow existing patterns in the codebase before introducing new ones —
  consistency matters more than personal preference at this stage.
- Frontend: Tailwind utility classes over custom CSS where possible.
  Match existing component structure in `components/`.
- Backend/Supabase: any change touching Row-Level Security policies or
  Edge Functions needs explicit review — these are the highest-risk surface
  for data leaks or broken access control.
- No secrets, API keys, or `.env` values committed, ever. Double-check diffs
  before pushing.

## Communication

- GitHub issues and pull requests are the durable record of technical work.
- If you're blocked or a task is bigger than expected, say so early.
- Ask a maintainer when product direction or scope is unclear.

## Reporting Bugs

Non-security bugs: open a GitHub issue with steps to reproduce, expected vs.
actual behavior, and screenshots if relevant.

Security or data-exposure issues: **do not open a public issue** — see
[`SECURITY.md`](./SECURITY.md) instead.

---

Building something people actually trust with money and digital work is the whole
point of The Middleman — so when in doubt on anything touching auth, payments,
or user data, ask before merging rather than after.
