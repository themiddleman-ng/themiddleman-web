import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { safeNextPath, signinHref } from "../lib/auth/signin-redirect.mjs";

test("safeNextPath only allows same-origin relative paths", () => {
  assert.equal(safeNextPath("/orders"), "/orders");
  assert.equal(safeNextPath("/messages?conversation=1"), "/messages?conversation=1");
  assert.equal(safeNextPath("https://evil.example/phish"), "");
  assert.equal(safeNextPath("//evil.example"), "");
  assert.equal(safeNextPath("/\\evil"), "");
  assert.equal(safeNextPath(""), "");
});

test("signinHref adds a return link for the original page", () => {
  assert.equal(signinHref("/orders"), "/signup?mode=signin&next=%2Forders");
  assert.equal(signinHref("/gigs/new"), "/signup?mode=signin&next=%2Fgigs%2Fnew");
  assert.equal(signinHref(""), "/signup?mode=signin");
});

test("signed-out account pages redirect instead of rendering the full screen", async () => {
  const orders = await readFile(new URL("../app/orders/PageClient.js", import.meta.url), "utf8");
  const messages = await readFile(new URL("../app/messages/PageClient.tsx", import.meta.url), "utf8");
  const newGig = await readFile(new URL("../app/gigs/new/page.tsx", import.meta.url), "utf8");
  const role = await readFile(new URL("../app/onboarding/role/PageClient.js", import.meta.url), "utf8");
  const signup = await readFile(new URL("../app/signup/PageClient.js", import.meta.url), "utf8");

  assert.match(orders, /signinHref\("\/orders"\)/);
  assert.match(messages, /signinHref\("\/messages"\)/);
  assert.match(newGig, /signinHref\('\/gigs\/new'\)/);
  assert.match(role, /signinHref\('\/onboarding\/role'\)/);
  assert.match(signup, /safeNextPath\(searchParams.get\('next'\)\)/);
  assert.doesNotMatch(orders, /Sign in to view your orders\./);
  assert.doesNotMatch(messages, /Sign in to view your messages\./);
});
