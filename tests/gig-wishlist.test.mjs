import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("wishlist API route guards sign-in and same-origin toggles", async () => {
  const route = await readFile(new URL("../app/api/gigs/[id]/wishlist/route.ts", import.meta.url), "utf8");
  assert.match(route, /authenticatedUser/);
  assert.match(route, /sameOriginMutation/);
  assert.match(route, /gig_wishlists/);
});

test("product detail saves redirect signed-out users back to the listing", async () => {
  const page = await readFile(new URL("../app/gigs/[id]/PageClient.tsx", import.meta.url), "utf8");
  assert.match(page, /signinHref\(returnPath\)/);
  assert.match(page, /toggleWishlist/);
  assert.match(page, /\/api\/gigs\/\$\{gigId\}\/wishlist/);
});

test("wishlist migration keeps rows scoped to each user", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20261025120000_gig_wishlists.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /primary key \(user_id, gig_id\)/i);
  assert.match(migration, /auth\.uid\(\) = user_id/);
});
