# Free database testing

Run `node --test tests/database-runtime.test.mjs` after `pnpm install --frozen-lockfile`.

PGlite is a development-only, in-memory PostgreSQL runtime. The capability test
uses synthetic records and a non-owner role to verify RLS, denied writes, status
constraints, and transaction rollback. No cloud project or credentials are used.

This initial probe does **not** verify the application's schema or complete Phase A.
The checked-in `supabase/schema.sql` differs from the inspected hosted schema;
it must not be mistaken for a faithful production baseline.

Subsequent application tests need a reviewed schema-only fixture and the actual
proposed repair SQL. PGlite does not provide Supabase Auth, PostgREST, Storage,
or Paystack. Separate integration tests remain required for signup, API grants,
webhook delivery, and real Paystack test-mode transactions. It cannot establish
multi-connection concurrency safety by itself.

The full local Supabase stack remains the preferred integration environment when
a Docker-compatible runtime is available. Never reset the hosted project to run tests.
