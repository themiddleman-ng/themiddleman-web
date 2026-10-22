import assert from "node:assert/strict";
import test from "node:test";
import { avatarExtension, avatarStoragePath, classifyAvatarFile, guessImageType } from "../lib/profile/avatar-file.mjs";

test("avatar files keep camera-roll photos instead of rejecting empty types", () => {
  assert.equal(guessImageType({ name: "IMG_1001.HEIC", type: "" }), "image/heic");
  assert.equal(classifyAvatarFile({ name: "shot.jpg", type: "", size: 120_000 }).ok, true);
  assert.equal(classifyAvatarFile({ name: "shot.heic", type: "image/heic", size: 120_000 }).needsConvert, true);
  assert.equal(classifyAvatarFile({ name: "notes.pdf", type: "application/pdf", size: 120_000 }).ok, false);
  assert.equal(classifyAvatarFile({ name: "huge.jpg", type: "image/jpeg", size: 4 * 1024 * 1024 }).code, "too-large");
});

test("avatar storage paths include a file extension", () => {
  assert.equal(avatarStoragePath("user-1", "image/jpeg"), "user-1/avatar.jpg");
  assert.equal(avatarStoragePath("user-1", "image/png"), "user-1/avatar.png");
  assert.equal(avatarExtension("image/webp"), "webp");
});
