import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("public seller route loads approved directory view and 404s unknown ids", async () => {
  const page = await readFile(new URL("../app/sellers/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /loadPublicSellerProfile/);
  assert.match(page, /notFound\(\)/);
  const loader = await readFile(new URL("../lib/server/public-seller-profile.ts", import.meta.url), "utf8");
  assert.match(loader, /public_seller_profiles/);
  assert.match(loader, /\.eq\('status', 'active'\)/);
});

test("product page links verified creators to public seller profiles", async () => {
  const page = await readFile(new URL("../app/gigs/[id]/PageClient.tsx", import.meta.url), "utf8");
  assert.match(page, /\/sellers\/\$\{gig\.seller_id\}/);
});

test("public seller migration limits anon reads to approved sellers", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20261025130000_public_seller_profiles.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /verification_status = 'approved'/i);
  assert.match(migration, /public_seller_profiles/);
  assert.doesNotMatch(migration, /id_document/i);
});
