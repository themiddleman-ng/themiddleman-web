# Contributing to The Middleman

Thanks for helping build this. This doc covers how we work day-to-day so
changes land cleanly and nobody steps on anyone else's work.

## Before you start

- Confirm access to the GitHub organization and this repo.
- Join the team Discord — most coordination happens there, not in GitHub comments.
- Skim the Project Bible and current Phase priorities before picking up work,
  so what you build fits the roadmap instead of duplicating or conflicting with it.

## Branching

- `main` is protected — no direct pushes.
- Branch naming: `phase-<n>/<short-description>`, e.g. `phase-1/auth-rls-policies`
  or `phase-2/listing-feed-pagination`.
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

- Discord is the source of truth for "what's being worked on right now."
- If you're blocked or a task is bigger than expected, say so early —
  better to flag it on day one than surface it on day five.
- Questions about product direction or scope go to Samuel directly.

## Reporting Bugs

Non-security bugs: open a GitHub issue with steps to reproduce, expected vs.
actual behavior, and screenshots if relevant.

Security or data-exposure issues: **do not open a public issue** — see
[`SECURITY.md`](./SECURITY.md) instead.

---

Building something people actually trust with money and goods is the whole
point of The Middleman — so when in doubt on anything touching auth, payments,
or user data, ask before merging rather than after.
