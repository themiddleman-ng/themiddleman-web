import assert from "node:assert/strict";
import test from "node:test";
import {
  candidateAvatarPaths,
  folderAvatarPath,
  isAvatarObjectName,
  metadataAvatarPath,
  readCachedOwnerAvatar,
  writeCachedOwnerAvatar,
} from "../lib/profile/owner-avatar.mjs";

test("metadata avatar paths ignore empty and unsafe values", () => {
  assert.equal(metadataAvatarPath(undefined), null);
  assert.equal(metadataAvatarPath({}), null);
  assert.equal(metadataAvatarPath({ profile_avatar_path: "  " }), null);
  assert.equal(metadataAvatarPath({ profile_avatar_path: "../secret.jpg" }), null);
  assert.equal(metadataAvatarPath({ profile_avatar_path: "/abs/avatar.jpg" }), null);
  assert.equal(metadataAvatarPath({ profile_avatar_path: "user-1/avatar.jpg" }), "user-1/avatar.jpg");
});

test("storage listing only accepts avatar image names in the user folder", () => {
  assert.equal(isAvatarObjectName("avatar.jpg"), true);
  assert.equal(isAvatarObjectName("avatar.png"), true);
  assert.equal(isAvatarObjectName("notes.pdf"), false);
  assert.equal(folderAvatarPath("user-1", "avatar.webp"), "user-1/avatar.webp");
  assert.equal(folderAvatarPath("user-1", "other.jpg"), null);
});

test("candidate paths keep a known file first and try common extensions", () => {
  assert.deepEqual(candidateAvatarPaths("user-1", "user-1/avatar.png"), [
    "user-1/avatar.png",
    "user-1/avatar.jpg",
    "user-1/avatar.jpeg",
    "user-1/avatar.webp",
  ]);
});

test("owner avatar cache is scoped to the signed-in user", () => {
  const storage = new Map();
  const adapter = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  writeCachedOwnerAvatar(adapter, { userId: "user-1", path: "user-1/avatar.jpg", url: "https://img/one" });
  assert.equal(readCachedOwnerAvatar(adapter, "user-2"), null);
  assert.deepEqual(readCachedOwnerAvatar(adapter, "user-1"), {
    userId: "user-1",
    path: "user-1/avatar.jpg",
    url: "https://img/one",
  });
  writeCachedOwnerAvatar(adapter, null);
  assert.equal(readCachedOwnerAvatar(adapter, "user-1"), null);
});
