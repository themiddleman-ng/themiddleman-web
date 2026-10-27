import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("public seller route loads approved directory view and 404s unknown ids", async () => {
  const page = await readFile(new URL("../app/sellers/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /loadPublicSellerProfile/);
  assert.match(page, /notFound\(\)/);
  const loader = await readFile(new URL("../lib/server/public-seller-profile.ts", import.meta.url), "utf8");
  assert.match(loader, /public_seller_profiles/);
  assert.match(loader, /user_id/);
  assert.doesNotMatch(loader, /from\('seller_profiles'\)/);
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
  assert.match(migration, /drop policy if exists "authenticated reads approved seller profiles"/);
  assert.doesNotMatch(migration, /create policy "authenticated reads approved seller profiles"/);
  assert.doesNotMatch(migration, /for select to anon/i);
  assert.match(migration, /sp\.id,\s*sp\.user_id,\s*sp\.display_name,\s*sp\.bio,\s*sp\.rating_avg/s);
  assert.doesNotMatch(migration, /select[\s\S]*id_document_url[\s\S]*from public\.seller_profiles/i);
  assert.doesNotMatch(migration, /sp\.linkedin_url/);
  assert.match(migration, /grant select \([\s\S]*linkedin_url/);
  const onboarding = await readFile(new URL("../app/onboarding/seller/PageClient.js", import.meta.url), "utf8");
  const written = [
    "user_id",
    "display_name",
    "bio",
    "skills",
    "portfolio_links",
    "linkedin_url",
    "years_experience",
    "gig_categories",
    "id_document_type",
    "id_document_url",
  ];
  for (const column of written) {
    assert.match(onboarding, new RegExp(`\\b${column}\\b`));
    assert.match(migration, new RegExp(`grant insert \\([\\s\\S]*${column}`));
    if (column !== "user_id") {
      assert.match(migration, new RegExp(`grant update \\([\\s\\S]*${column}`));
    }
  }
});

test("marketplace gig queries attach public seller cards view", async () => {
  const helper = await readFile(new URL("../lib/marketplace/attach-public-sellers.mjs", import.meta.url), "utf8");
  const feed = await readFile(new URL("../components/marketplace/HomeFeed.tsx", import.meta.url), "utf8");
  const marketplace = await readFile(new URL("../app/marketplace/PageClient.tsx", import.meta.url), "utf8");
  const product = await readFile(new URL("../app/gigs/[id]/PageClient.tsx", import.meta.url), "utf8");
  assert.match(helper, /public_seller_profile_cards/);
  assert.match(feed, /attachPublicSellerCards/);
  assert.match(marketplace, /attachPublicSellerCards/);
  assert.match(product, /public_seller_profiles/);
  assert.doesNotMatch(product, /from\("seller_profiles"\)[\s\S]{0,120}verification_status/);
});

test("buyer-facing seller names use the public view or service role", async () => {
  const messages = await readFile(new URL("../app/api/conversations/route.ts", import.meta.url), "utf8");
  const orders = await readFile(new URL("../app/api/orders/route.ts", import.meta.url), "utf8");
  const adminSellers = await readFile(new URL("../app/admin/sellers/page.tsx", import.meta.url), "utf8");
  assert.match(messages, /public_seller_profiles/);
  assert.match(messages, /serviceClient/);
  assert.doesNotMatch(messages, /seller_profiles!conversations_seller_id_fkey/);
  assert.match(orders, /serviceClient/);
  assert.doesNotMatch(orders, /seller_profiles!orders_seller_id_fkey\(display_name\)/);
  assert.match(adminSellers, /requireAdminPage/);
  assert.match(adminSellers, /seller_profiles/);
});
