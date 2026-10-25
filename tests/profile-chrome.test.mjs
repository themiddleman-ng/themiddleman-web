import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const header = await readFile(new URL("../components/SiteHeader.tsx", import.meta.url), "utf8");
const profile = await readFile(new URL("../app/profile/PageClient.tsx", import.meta.url), "utf8");
const tabs = await readFile(new URL("../components/layout/MobileTabBar.tsx", import.meta.url), "utf8");
const settings = await readFile(new URL("../app/settings/PageClient.tsx", import.meta.url), "utf8");
const security = await readFile(new URL("../app/security/security-settings.tsx", import.meta.url), "utf8");

test("header and tab bar read the shared owner avatar instead of JWT initials only", () => {
  assert.match(header, /useOwnerAvatar/);
  assert.match(header, /OwnerAvatar/);
  assert.match(header, /Authenticator &amp; security/);
  assert.match(header, /Admin workspace/);
  assert.doesNotMatch(header, /createSignedUrl/);
  assert.match(tabs, /useOwnerAvatar/);
  assert.match(tabs, /OwnerAvatar/);
});

test("profile save returns to a read-only summary and keeps the sign-in email", () => {
  assert.match(profile, /editingProfile/);
  assert.match(profile, /Your saved details/);
  assert.match(profile, /This cannot be changed here/);
  assert.match(profile, /saveOwnerAvatarPath/);
  assert.match(profile, /setEditingProfile\(false\)/);
});

test("admin and authenticator are discoverable without weakening the gate", () => {
  assert.match(settings, /Set up authenticator/);
  assert.match(settings, /Not an admin account/);
  assert.match(security, /Google Authenticator or Authy/);
  assert.match(security, /needsAdminUnlock/);
  assert.match(security, /isAdmin &&/);
});
