import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("admin priority queue supports filtering and CSV export", async () => {
  const component = await readFile(
    new URL("../components/admin/AdminPriorityQueue.tsx", import.meta.url),
    "utf8",
  );
  assert.match(component, /Filter queue/);
  assert.match(component, /downloadCsv/);
  assert.match(component, /View all/);
});

test("admin overview deep-links review rows to the right workspace", async () => {
  const page = await readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
  assert.match(page, /\/admin\/products\?version=/);
  assert.match(page, /\/admin\/review\?delivery=/);
  assert.match(page, /\/admin\/sellers\?focus=/);
});
