# Demo cleanup plan

Nothing in this plan has been run. No connection was made to the test project `vhfskuabgsudbaiqotth` or to production `uwigyojtiudefnwjezhm`. Production is not to be contacted. Counts below are candidates from files in this repo, not a live inventory.

## What the two projects are

| Project | Ref | What to do |
|---|---|---|
| Isolated test | `vhfskuabgsudbaiqotth` | A human may later run the read-only counts in `demo-cleanup-inventory.sql`, export the matching rows, and only then decide. This change does not do that. |
| Production | `uwigyojtiudefnwjezhm` | Manual review only. Do not run the inventory file, the commented statements, or any delete. If a row looks like a fixture, export it and stop. |

## Candidates this repo can name

These are the only ids `scripts/seed-isolated-db.sql` inserts. They are candidates, not confirmed present.

| Table | Ids | Why it might be demo |
|---|---|---|
| `public.gigs` | `44444444-4444-4444-8444-444444444401`, `44444444-4444-4444-8444-444444444402` | Titles are the sample invoice tracker (active) and sample menu template (draft). |
| `public.seller_profiles` | `33333333-3333-4333-8333-333333333301`, `33333333-3333-4333-8333-333333333302` | Display names are "Sample seller" and "Sample seller (pending)". |
| `public.gig_wishlists` | user `11111111-1111-4111-8111-111111111101` plus gig `44444444-4444-4444-8444-444444444401` | The seed's only wishlist row. |

Storage paths named by that seed, not confirmed in a bucket:

- `verification-docs/secret-approved.pdf`
- `verification-docs/secret-pending.pdf`
- Gallery values `/images/listings/invoice-tracker.webp` and `/images/listings/menu-template.webp` are app files, not storage objects.

Code fixtures that stay. No cleaning was done:

- `lib/design-preview/catalog.ts` (`preview-invoice-tracker` and the other `preview-*` ids). These are not database rows.
- `app/design-review` sample screens.
- `fixtures/hello-world/` (offline test program, not a listing).

## Excluded

Do not delete, even on the test project, without a separate written decision:

- `auth.users` and any real sign-in
- `public.users` rows that are not the four seed ids, and do not delete those four either unless the export proves they are the seed
- `public.orders`, `public.payments`, deliveries, disputes, messages, audit logs
- admin configuration, `public.profiles.role = admin`, payout accounts
- anything whose id is not in the table above

The seed file also inserts four `auth.users` and four `public.users` rows. Those ids may be counted. They are not deletion candidates in this plan. `public.users` in `schema.sql` and `staging_bootstrap.sql` has no `role` column. The seed still inserts `role`. That statement may fail on the checked-in schema. Live columns were not inspected.

## Dependencies

- `gigs.seller_id` points at `seller_profiles.id`.
- `seller_profiles.user_id` points at `public.users.id` / `auth.users.id`.
- `gig_wishlists` points at both a user and a gig.
- Later migrations add product versions, orders, and storage paths that can reference a gig or seller. A delete of a gig can fail or cascade. This repo was not used to list those foreign keys on a live database.

## Before any delete on the test project

1. Confirm the connection string is `vhfskuabgsudbaiqotth` and not `uwigyojtiudefnwjezhm`.
2. Export the candidate rows and any referencing rows to a file you keep outside the database. A backup of those tables is required. Re-applying `scripts/seed-isolated-db.sql` is not a rollback: it does not restore a row that had been edited, it does not undo cascades, and it does not put a storage object back.
3. Run only the `select` statements in `demo-cleanup-inventory.sql`. Read every returned row. If a title, email, or price is not the sample text, stop.
4. Delete one table at a time, children first (wishlist, then gigs, then seller profiles), and only the ids listed above. Do not uncomment a delete in this folder until that review is written down.

## Production

Do not execute SQL. A person with production access can look, in the dashboard, for the same titles and ids. If they are absent, there is nothing to do. If they are present, export them and ask before deleting. This change did not look.
