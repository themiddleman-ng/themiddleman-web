const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function alert(code, field, title, message, extra = {}) {
  return { code, field, title, message, ...extra };
}

export function validateLoginInput({ email = "", password = "" } = {}) {
  const trimmed = String(email).trim();
  if (!trimmed) {
    return alert("missing-email", "email", "Enter your email", "Use the email address on your Middleman account.");
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return alert("invalid-email", "email", "That email doesn’t look right", "Use a full address, like ada@studio.com.");
  }
  if (!String(password)) {
    return alert("missing-password", "password", "Enter your password", "The password field is empty.");
  }
  return null;
}

export function classifyLoginError(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || error?.error_description || "").toLowerCase();
  const status = Number(error?.status || 0);

  if (
    code === "invalid_credentials" ||
    code === "invalid_grant" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid grant")
  ) {
    return alert(
      "invalid-credentials",
      "credentials",
      "Email or password is incorrect",
    );
  }

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return alert(
      "email-not-confirmed",
      "email",
      "Confirm your email first",
      "Open the confirmation link we sent to this address, then come back to log in.",
    );
  }

  if (status === 429 || code.includes("rate_limit") || message.includes("too many requests") || message.includes("rate limit")) {
    return alert(
      "rate-limit",
      "form",
      "Too many sign-in attempts",
      "Wait a few minutes before trying again. Your email and password are still here.",
    );
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("load failed") ||
    message.includes("fetch failed") ||
    code === "network_error"
  ) {
    return alert(
      "network",
      "form",
      "Can’t reach the sign-in service",
      "Check your connection and try again. Your email and password were kept.",
    );
  }

  if (message.includes("invalid api key") || code === "invalid_api_key") {
    return alert(
      "unavailable",
      "form",
      "Sign-in isn’t available right now",
      "The account service rejected this environment. Your email and password were kept.",
    );
  }

  return alert(
    "generic",
    "form",
    "Sign-in didn’t go through",
    "Check your email and password, then try again.",
  );
}

export function applyLoginFailure({ email = "", password = "", alert: failure }) {
  return {
    email,
    password: failure?.code === "invalid-credentials" ? "" : password,
    focus: failure?.code === "invalid-credentials" ? "password" : failure?.field || "form",
  };
}

export function classifySignupError(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  if (code === "user_already_exists" || message.includes("already registered") || message.includes("already been registered")) {
    return alert(
      "email-taken",
      "email",
      "This email already has an account",
      "Log in with it, or reset the password if you don’t remember it.",
      { actionLabel: "Log in" },
    );
  }

  if (code === "weak_password" || message.includes("password")) {
    return alert(
      "weak-password",
      "password",
      "Choose a stronger password",
      "Use 12–128 characters with an uppercase letter, a lowercase letter, a number, and a symbol.",
    );
  }

  if (code === "email_address_invalid" || code === "validation_failed" || message.includes("invalid email") || message.includes("unable to validate email")) {
    return alert("invalid-email", "email", "That email doesn’t look right", "Use a full address, like ada@studio.com.");
  }

  if (Number(error?.status) === 429 || code.includes("rate") || message.includes("rate limit") || message.includes("too many")) {
    return alert("rate-limit", "form", "Too many attempts", "Wait a few minutes, then try creating the account again.");
  }

  if (message.includes("failed to fetch") || message.includes("network")) {
    return alert("network", "form", "Can’t reach the sign-up service", "Check your connection and try again. What you typed is still here.");
  }

  return alert("generic", "form", "The account wasn’t created", "Check the form and try again.");
}
