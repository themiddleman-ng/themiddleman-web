import assert from "node:assert/strict";
import test from "node:test";
import { applyLoginFailure, classifyLoginError, classifySignupError, validateLoginInput } from "../lib/auth/login-errors.mjs";

test("login validation names the empty and malformed fields", () => {
  assert.equal(validateLoginInput({ email: "  ", password: "secret" }).code, "missing-email");
  assert.equal(validateLoginInput({ email: "ada", password: "secret" }).code, "invalid-email");
  assert.equal(validateLoginInput({ email: "ada@studio.com", password: "" }).code, "missing-password");
  assert.equal(validateLoginInput({ email: " ada@studio.com ", password: "secret" }), null);
});

test("wrong email or password keeps the email and clears the password", () => {
  for (const error of [
    { code: "invalid_credentials", message: "Invalid login credentials" },
    { code: "invalid_grant", error_description: "Invalid grant" },
    { message: "Invalid login credentials" },
  ]) {
    const failure = classifyLoginError(error);
    const next = applyLoginFailure({ email: "ada@studio.com", password: "wrong-password", alert: failure });
    assert.equal(failure.code, "invalid-credentials");
    assert.equal(failure.field, "credentials");
    assert.equal(next.email, "ada@studio.com");
    assert.equal(next.password, "");
    assert.equal(next.focus, "password");
    assert.match(failure.message, /email stays filled in/i);
    assert.equal(failure.actionHref, "/reset-password");
  }
});

test("login failures that are not a bad password keep both fields", () => {
  const cases = [
    [{ code: "email_not_confirmed", message: "Email not confirmed" }, "email-not-confirmed", "email"],
    [{ status: 429, message: "Too many requests" }, "rate-limit", "form"],
    [{ message: "Failed to fetch" }, "network", "form"],
    [{ message: "Invalid API key" }, "unavailable", "form"],
    [{ message: "something else" }, "generic", "form"],
  ];
  for (const [error, code, field] of cases) {
    const failure = classifyLoginError(error);
    const next = applyLoginFailure({ email: "ada@studio.com", password: "kept-secret", alert: failure });
    assert.equal(failure.code, code);
    assert.equal(failure.field, field);
    assert.equal(next.email, "ada@studio.com");
    assert.equal(next.password, "kept-secret");
  }
});

test("signup errors stay specific instead of repeating the provider text", () => {
  assert.equal(classifySignupError({ message: "User already registered" }).code, "email-taken");
  assert.equal(classifySignupError({ code: "weak_password" }).field, "password");
  assert.equal(classifySignupError({ message: "Unable to validate email address" }).code, "invalid-email");
  assert.equal(classifySignupError({ status: 429, message: "email rate limit exceeded" }).code, "rate-limit");
  assert.equal(classifySignupError({ message: "Failed to fetch" }).code, "network");
  assert.equal(classifySignupError({ message: "database timeout xyz" }).code, "generic");
  assert.doesNotMatch(classifySignupError({ message: "database timeout xyz" }).message, /database timeout/);
});
