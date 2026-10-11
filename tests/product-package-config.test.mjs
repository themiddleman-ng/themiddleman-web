import test from "node:test";
import assert from "node:assert/strict";
import { productPackagesEnabled } from "../lib/server/product-package-config.mjs";

const base = {
  MARKETPLACE_PRODUCT_PACKAGES_ENABLED: "true",
  NEXT_PUBLIC_MARKETPLACE_PRODUCT_PACKAGES_ENABLED: "true",
  MARKETPLACE_ISOLATED_PREVIEW: "true",
  VERCEL_ENV: "preview",
  NEXT_PUBLIC_SUPABASE_URL: "https://middleman-preview.supabase.co",
};

test("product package flow requires both explicit gates and an isolated database", () => {
  assert.equal(productPackagesEnabled(base), true);
  assert.equal(productPackagesEnabled({ ...base, VERCEL_ENV: "production" }), false);
  assert.equal(productPackagesEnabled({
    ...base,
    NEXT_PUBLIC_SUPABASE_URL: "https://uwigyojtiudefnwjezhm.supabase.co",
  }), false);
  assert.equal(productPackagesEnabled({ ...base, MARKETPLACE_ISOLATED_PREVIEW: "false" }), false);
  assert.equal(productPackagesEnabled({ ...base, MARKETPLACE_PRODUCT_PACKAGES_ENABLED: "false" }), false);
  assert.equal(productPackagesEnabled({ ...base, NEXT_PUBLIC_MARKETPLACE_PRODUCT_PACKAGES_ENABLED: "false" }), false);
  assert.equal(productPackagesEnabled({ ...base, NEXT_PUBLIC_SUPABASE_URL: "not a url" }), false);
});
