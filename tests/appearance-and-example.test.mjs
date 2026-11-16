import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { productShareUrl } from "../lib/share/product-link.mjs";

test("light appearance is opt-in and the approved dark tokens stay on :root", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const boot = await readFile(new URL("../lib/theme/appearance.ts", import.meta.url), "utf8");
  assert.match(css, /--ink: #1E1E22/);
  assert.match(css, /--logo-orange: #E8590C/);
  assert.match(css, /html\[data-theme="light"\][\s\S]*--ink: #FFFFFF/);
  assert.match(css, /html\[data-theme="light"\][\s\S]*--logo-orange: #E8590C/);
  assert.match(css, /html\[data-theme="light"\][\s\S]*--ember: #F97316/);
  assert.match(boot, /mm-appearance/);
  assert.match(boot, /prefers-color-scheme: light/);
});

test("the Hello World example is an in-code listing with a public demo and zip", async () => {
  const catalog = await readFile(new URL("../lib/design-preview/catalog.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/gigs/[id]/PageClient.tsx", import.meta.url), "utf8");
  const demo = await readFile(new URL("../public/examples/hello-world/demo.html", import.meta.url), "utf8");
  assert.match(catalog, /preview-hello-world/);
  assert.match(catalog, /not a real seller/);
  assert.match(catalog, /price_ngn: 0/);
  assert.match(page, /EXAMPLE_HELLO_WORLD_ID/);
  assert.match(page, /sandbox="allow-scripts"/);
  assert.match(page, /hello-world-test\.zip/);
  assert.match(page, /Free example/);
  assert.match(demo, /Hello World/);
  assert.doesNotMatch(demo, /https?:\/\//);
  const hello = productShareUrl("preview-hello-world");
  const invoice = productShareUrl("preview-invoice-tracker");
  assert.equal(hello, "https://themiddleman.com.ng/gigs/preview-hello-world");
  assert.notEqual(hello, invoice);
});
