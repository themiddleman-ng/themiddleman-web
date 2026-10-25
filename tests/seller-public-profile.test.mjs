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
  assert.match(migration, /security_invoker = false/i);
  assert.match(migration, /authenticated reads own seller profile/);
  assert.doesNotMatch(migration, /for select to anon/i);
  assert.match(migration, /sp\.id,\s*sp\.display_name,\s*sp\.bio,\s*sp\.rating_avg/s);
  assert.doesNotMatch(migration, /select[\s\S]*id_document_url[\s\S]*from public\.seller_profiles/i);
});

test("marketplace gig queries attach public seller cards view", async () => {
  const helper = await readFile(new URL("../lib/marketplace/attach-public-sellers.mjs", import.meta.url), "utf8");
  const feed = await readFile(new URL("../components/marketplace/HomeFeed.tsx", import.meta.url), "utf8");
  assert.match(helper, /public_seller_profile_cards/);
  assert.match(feed, /attachPublicSellerCards/);
});
