import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFormDraftKey,
  clearFormDraft,
  isSecretFormField,
  readFormDraft,
  resolveFormDraftKey,
  sanitizeDraftValues,
  writeFormDraft,
} from "../lib/forms/persisted-form.mjs";

test("sanitizeDraftValues never persists secrets or files", () => {
  const file = { name: "id.pdf" };
  const values = {
    fullName: "Ada",
    password: "secret",
    accountNumber: "0123456789",
    avatar: file,
    images: [file],
  };
  const safe = sanitizeDraftValues(values, ["token"]);
  assert.deepEqual(safe, { fullName: "Ada" });
  assert.equal(isSecretFormField("password"), true);
  assert.equal(isSecretFormField("fullName"), false);
});

test("form draft keys are scoped per user and form", () => {
  const anon = buildFormDraftKey("signup", "anon", "new");
  const user = buildFormDraftKey("signup", "user-1", "new");
  assert.match(anon, /signup/);
  assert.notEqual(anon, user);
});

test("resolveFormDraftKey migrates anon drafts after sign-in", () => {
  const storage = new Map();
  const api = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  const anonKey = buildFormDraftKey("signup", "anon", "new");
  writeFormDraft(api, anonKey, { email: "ada@example.com" });
  const resolved = resolveFormDraftKey(api, "signup", "user-1", "new");
  assert.equal(resolved, buildFormDraftKey("signup", "user-1", "new"));
  assert.deepEqual(readFormDraft(api, resolved), { email: "ada@example.com" });
  assert.equal(readFormDraft(api, anonKey), null);
});

test("clearFormDraft removes stored values", () => {
  const storage = new Map();
  const api = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  const key = buildFormDraftKey("profile-settings", "user-1", "new");
  writeFormDraft(api, key, { bio: "Builder" });
  clearFormDraft(api, key);
  assert.equal(readFormDraft(api, key), null);
});
