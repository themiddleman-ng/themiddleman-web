import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  clearedMarketplaceFilters,
  countActiveMarketplaceFilters,
} from "../lib/marketplace/active-filters.mjs";

const marketplace = await readFile(new URL("../app/marketplace/PageClient.tsx", import.meta.url), "utf8");
const marketplaceCss = await readFile(new URL("../app/product-design.css", import.meta.url), "utf8");
const notifications = await readFile(new URL("../app/notifications/page.tsx", import.meta.url), "utf8");
const sellerSupport = await readFile(new URL("../app/seller-support/PageClient.tsx", import.meta.url), "utf8");

test("marketplace counts only the four live filters", () => {
  assert.equal(countActiveMarketplaceFilters(clearedMarketplaceFilters()), 0);
  assert.equal(countActiveMarketplaceFilters({ category: "design" }), 1);
  assert.equal(countActiveMarketplaceFilters({ query: "  invoice  " }), 1);
  assert.equal(countActiveMarketplaceFilters({ priceRange: "under5" }), 1);
  assert.equal(countActiveMarketplaceFilters({ sort: "low" }), 1);
  assert.equal(countActiveMarketplaceFilters({
    category: "writing",
    query: "planner",
    priceRange: "over25",
    sort: "high",
  }), 4);
  assert.equal(countActiveMarketplaceFilters({ query: "   " }), 0);
});

test("Clear all sits beside the product count and hides when none are set", () => {
  assert.match(marketplace, /className="mm-catalogue-status"/);
  assert.match(marketplace, /Clear all \(\$\{activeFilterCount\}\)/);
  assert.match(marketplace, /className="mm-clear-filters"/);
  assert.match(marketplace, /activeFilterCount > 0/);
  assert.match(marketplace, /clearedMarketplaceFilters\(\)/);
  assert.match(marketplace, /setActiveCategory\(next\.category/);
  assert.match(marketplace, /setQuery\(next\.query\)/);
  assert.match(marketplace, /setPriceRange\(next\.priceRange\)/);
  assert.match(marketplace, /setSort\(next\.sort\)/);
  assert.doesNotMatch(marketplace, />Clear filters</);
  assert.match(marketplaceCss, /min-height:\s*44px/);
  assert.match(marketplaceCss, /min-width:\s*44px/);
  assert.match(marketplaceCss, /\.mm-clear-filters[\s\S]*background:\s*transparent/);
});

test("signed-out notifications are a single centred empty state", () => {
  assert.match(notifications, /Sign in to see your notifications/);
  assert.match(notifications, /BellIcon/);
  assert.match(notifications, /bg-ember-cta/);
  assert.match(notifications, /text-on-ember/);
  assert.match(notifications, /mm-signed-out-empty/);
  assert.match(notifications, /signinHref\("\/notifications"\)/);
  assert.match(notifications, /response\.status === 401/);
  assert.match(notifications, /setSignedOut\(true\)/);
  assert.match(notifications, /!signedOut && !error && !items\.length/);
  assert.match(notifications, /!loading && !signedOut \? <p className="mt-2 text-sm text-slate">\{unreadCount\} unread<\/p>/);
  assert.doesNotMatch(notifications, /bg-\[#C2410C\]/);
});

test("seller support treats 404 as a neutral notice and 401 as a sign-in return", () => {
  assert.match(sellerSupport, /Operations messages aren't available yet/);
  assert.match(sellerSupport, /InfoIcon/);
  assert.match(sellerSupport, /mm-info-panel/);
  assert.match(sellerSupport, /text-slate/);
  assert.match(sellerSupport, /response\.status === 404/);
  assert.match(sellerSupport, /signinHref\("\/seller-support"\)/);
  assert.match(sellerSupport, /error && !unavailable &&/);
  assert.doesNotMatch(sellerSupport, /warning/);
  assert.match(sellerSupport, /<div role="status" className="mm-info-panel">/);
});
