import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("about slug copy no longer mentions multi-currency payments", async () => {
  const page = await readFile(new URL("../app/[slug]/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /multi-currency/i);
});

test("globals theme drops non-orange accent tokens", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /--accent-violet/);
  assert.match(css, /--accent-ember/);
});

test("messages composer uses full-width flex layout at tablet breakpoints", async () => {
  const page = await readFile(new URL("../app/messages/PageClient.tsx", import.meta.url), "utf8");
  assert.match(page, /min-w-0 w-full flex-1 basis-0/);
});

test("account menu exposes messages with minimum tap height", async () => {
  const header = await readFile(new URL("../components/SiteHeader.tsx", import.meta.url), "utf8");
  assert.match(header, /href="\/messages".*min-h-11/s);
});
