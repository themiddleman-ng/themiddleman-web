import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { productShareImageUrl, productShareUrl, whatsappShareHref } from "../lib/share/product-link.mjs";

test("two fixture products get distinct stable links on the apex domain", async () => {
  const catalog = await readFile(new URL("../lib/design-preview/catalog.ts", import.meta.url), "utf8");
  assert.match(catalog, /id: "preview-invoice-tracker"/);
  assert.match(catalog, /title: "Invoice & Expense Tracker"/);
  assert.match(catalog, /price_ngn: 8500/);
  assert.match(catalog, /id: "preview-landing-page-kit"/);
  assert.match(catalog, /title: "Business Landing Page Kit"/);
  assert.match(catalog, /price_ngn: 25000/);
  const invoiceUrl = productShareUrl("preview-invoice-tracker");
  const landingUrl = productShareUrl("preview-landing-page-kit");
  assert.equal(invoiceUrl, "https://themiddleman.com.ng/gigs/preview-invoice-tracker");
  assert.equal(landingUrl, "https://themiddleman.com.ng/gigs/preview-landing-page-kit");
  assert.notEqual(invoiceUrl, landingUrl);
  assert.equal(productShareUrl("preview-invoice-tracker"), invoiceUrl);
  assert.equal(productShareImageUrl("id with space"), "https://themiddleman.com.ng/gigs/id%20with%20space/opengraph-image");
  assert.doesNotMatch(invoiceUrl, /localhost/);
});

test("WhatsApp text encodes the fixture title and the stable link", () => {
  const href = whatsappShareHref("Invoice & Expense Tracker", productShareUrl("preview-invoice-tracker"));
  assert.equal(href.startsWith("https://wa.me/?text="), true);
  const text = decodeURIComponent(href.slice("https://wa.me/?text=".length));
  assert.match(text, /Invoice & Expense Tracker/);
  assert.match(text, /https:\/\/themiddleman.com.ng\/gigs\/preview-invoice-tracker/);
  assert.doesNotMatch(href, /localhost/);
  assert.doesNotMatch(href, /utm_/);
});

test("unknown products stay unavailable and the card image is on the public origin", async () => {
  const page = await readFile(new URL("../app/gigs/[id]/page.tsx", import.meta.url), "utf8");
  const menu = await readFile(new URL("../components/gigs/ProductShareMenu.tsx", import.meta.url), "utf8");
  assert.match(page, /gigShareImageUrl\(id\)/);
  assert.match(page, /title: "Product unavailable"/);
  assert.match(page, /index: false/);
  assert.match(page, /twitter: \{\s*card: "summary_large_image"/);
  assert.match(menu, /ShareNetworkIcon/);
  assert.match(menu, /productShareUrl\(productId\)/);
  assert.doesNotMatch(menu, /window\.location\.href/);
  assert.doesNotMatch(menu, /utm_/);
});
