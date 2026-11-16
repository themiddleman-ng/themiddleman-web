import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { localPublicImage } from "../lib/og/local-cover.mjs";
import { productShareImageUrl, productShareUrl, shareDescription, shareOrigin, whatsappShareHref } from "../lib/share/product-link.mjs";

const PREVIEW = {
  VERCEL_ENV: "preview",
  VERCEL_BRANCH_URL: "themiddleman-web-git-design-ui8-dark-samuel-oguntona-s-projects.vercel.app",
};

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
  const image = await readFile(new URL("../app/gigs/[id]/opengraph-image.tsx", import.meta.url), "utf8");
  assert.match(page, /productShareUrl\(id\)/);
  assert.match(page, /notFound\(\)/);
  assert.match(page, /title: "Product unavailable"/);
  assert.match(page, /index: false/);
  assert.match(page, /twitter: \{\s*card: "summary_large_image"/);
  assert.match(menu, /ShareNetworkIcon/);
  assert.match(menu, /whatsappShareHref\(title, url\)/);
  assert.match(menu, /navigator\.share\(\{ title, url \}\)/);
  assert.doesNotMatch(menu, /productShareUrl\(/);
  assert.doesNotMatch(menu, /window\.location/);
  assert.doesNotMatch(menu, /utm_/);
  assert.doesNotMatch(image, /fetch\(/);
  assert.match(image, /localPublicImage/);
});

test("preview product links use the validated branch host and refuse a swapped host", () => {
  const hello = productShareUrl("preview-hello-world", PREVIEW);
  const invoice = productShareUrl("preview-invoice-tracker", PREVIEW);
  assert.equal(hello, "https://themiddleman-web-git-design-ui8-dark-samuel-oguntona-s-projects.vercel.app/gigs/preview-hello-world");
  assert.equal(invoice, "https://themiddleman-web-git-design-ui8-dark-samuel-oguntona-s-projects.vercel.app/gigs/preview-invoice-tracker");
  assert.equal(productShareImageUrl("preview-hello-world", PREVIEW), `${hello}/opengraph-image`);
  assert.notEqual(hello, invoice);
  assert.equal(shareOrigin({ VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "https://evil.example/gigs" }), null);
  assert.equal(shareOrigin({ VERCEL_ENV: "preview", Host: "evil.example", VERCEL_URL: "themiddleman-web.evil.vercel.app" }), null);
  assert.equal(productShareUrl("preview-hello-world", { VERCEL_ENV: "production", VERCEL_BRANCH_URL: PREVIEW.VERCEL_BRANCH_URL }), "https://themiddleman.com.ng/gigs/preview-hello-world");
});

test("share text names the seller, the short summary, and the price", () => {
  assert.equal(shareDescription({
    sellerName: "Example listing",
    summary: "Prints Hello World. Not a real seller or a sale.",
    priceLabel: "Free example",
  }), "Example listing. Prints Hello World. Not a real seller or a sale. Free example.");
  const invoice = shareDescription({ sellerName: "Sample seller", summary: "A spreadsheet template.", priceLabel: "₦8,500" });
  assert.match(invoice, /^Sample seller\. A spreadsheet template\. ₦8,500\.$/);
  assert.doesNotMatch(invoice, /Verified|review/i);
});

test("cover files stay inside public and remote urls are refused", () => {
  assert.equal(localPublicImage("/examples/hello-world/cover.png")?.endsWith("public/examples/hello-world/cover.png"), true);
  assert.equal(localPublicImage("/images/listings/invoice-tracker.webp")?.endsWith("invoice-tracker.webp"), true);
  assert.equal(localPublicImage("https://evil.example/cover.png"), null);
  assert.equal(localPublicImage("//evil.example/cover.png"), null);
  assert.equal(localPublicImage("/../package.json"), null);
});
