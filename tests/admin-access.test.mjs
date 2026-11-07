import assert from "node:assert/strict";
import test from "node:test";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = new URL("..", import.meta.url);

async function routeFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await routeFiles(full));
    else if (entry.name === "route.ts") files.push(full);
  }
  return files;
}

test("admin API routes deny callers who are not an aal2 admin", async () => {
  const dir = path.join(root.pathname, "app/api/admin");
  const files = await routeFiles(dir);
  assert.ok(files.length >= 6);
  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert.match(source, /adminUser\(/);
    assert.match(source, /403/);
    assert.doesNotMatch(source, /user_metadata/);
  }
});

test("admin pages use the server gate, and the menu does not trust user metadata", async () => {
  const page = await readFile(new URL("../lib/server/admin-page.ts", import.meta.url), "utf8");
  const adminUser = await readFile(new URL("../lib/server/marketplace.ts", import.meta.url), "utf8");
  const hook = await readFile(new URL("../lib/account/use-admin-account.ts", import.meta.url), "utf8");
  const frame = await readFile(new URL("../components/design/DesignFrame.tsx", import.meta.url), "utf8");
  const sql = await readFile(new URL("../supabase/manual/20261107190000_protect_profile_role.sql", import.meta.url), "utf8");
  assert.match(page, /adminUser\(\)/);
  assert.match(page, /notFound\(\)/);
  assert.match(page, /redirect\("\/security\?next=admin"\)/);
  assert.match(adminUser, /data\?\.role !== 'admin'/);
  assert.match(adminUser, /currentLevel !== 'aal2'/);
  assert.doesNotMatch(adminUser, /user_metadata/);
  assert.match(hook, /\.from\("profiles"\)/);
  assert.match(hook, /data\?\.role === "admin"/);
  assert.doesNotMatch(hook, /user_metadata/);
  assert.match(frame, /onAdminPath && isAdminAccount/);
  assert.match(sql, /current_user in \('authenticated', 'anon'\)/);
  assert.match(sql, /protect_profile_role_insert/);
  assert.match(sql, /protect_profile_role_update/);
  assert.match(sql, /profile role is assigned by the platform/);
});
