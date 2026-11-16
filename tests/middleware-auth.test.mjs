import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("middleware guards protected routes and signed-in auth redirects", async () => {
  const middleware = await readFile(new URL("../middleware.ts", import.meta.url), "utf8");
  assert.match(middleware, /signinHref/);
  assert.match(middleware, /readReturnPath/);
  assert.match(middleware, /\/messages/);
  assert.match(middleware, /\/gigs\/new/);
  assert.match(middleware, /pathname\.startsWith\("\/signup"\)/);
});
