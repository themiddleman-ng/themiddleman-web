export const FORM_DRAFT_PREFIX = "themiddleman-form-draft:v1";

const SECRET_KEY_RE =
  /(password|passwd|otp|token|secret|card|cvv|cvc|iban|accountnumber|account_number|bank|pin|file|files|image|images|video)$/i;

export function isSecretFormField(key) {
  return SECRET_KEY_RE.test(String(key));
}

export function buildFormDraftKey(formId, scopeId, recordId = "new") {
  const scope = String(scopeId || "anon").trim() || "anon";
  const form = String(formId || "form").trim() || "form";
  const record = String(recordId || "new").trim() || "new";
  return `${FORM_DRAFT_PREFIX}:${scope}:${form}:${record}`;
}

function isPersistableValue(value) {
  if (value === null) return true;
  const kind = typeof value;
  if (kind === "string" || kind === "number" || kind === "boolean") return true;
  if (value instanceof File) return false;
  if (Array.isArray(value)) return value.every((item) => isPersistableValue(item));
  return false;
}

export function sanitizeDraftValues(values, extraSecretKeys = []) {
  if (!values || typeof values !== "object") return {};
  const blocked = new Set((extraSecretKeys || []).map((key) => String(key)));
  const out = {};
  for (const [key, value] of Object.entries(values)) {
    if (blocked.has(key) || isSecretFormField(key)) continue;
    if (!isPersistableValue(value)) continue;
    out[key] = value;
  }
  return out;
}

export function readFormDraft(storage, key) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeFormDraft(storage, key, values, extraSecretKeys = []) {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(sanitizeDraftValues(values, extraSecretKeys)));
  } catch {
    /* Storage may be blocked in private browsing. */
  }
}

export function clearFormDraft(storage, key) {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    /* Ignore storage failures. */
  }
}

/** Prefer a signed-in draft; migrate anon draft to the user key when logging in. */
export function resolveFormDraftKey(storage, formId, userId, recordId = "new") {
  const userKey = buildFormDraftKey(formId, userId || "anon", recordId);
  if (!userId) return userKey;
  const anonKey = buildFormDraftKey(formId, "anon", recordId);
  const userDraft = readFormDraft(storage, userKey);
  if (userDraft) return userKey;
  const anonDraft = readFormDraft(storage, anonKey);
  if (anonDraft) {
    writeFormDraft(storage, userKey, anonDraft);
    clearFormDraft(storage, anonKey);
  }
  return userKey;
}
