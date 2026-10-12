"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SecuritySettings() {
  const [ready, setReady] = useState(false),
    [email, setEmail] = useState(""),
    [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false),
    [factor, setFactor] = useState(""),
    [qr, setQr] = useState("");
  const [secret, setSecret] = useState(""),
    [code, setCode] = useState(""),
    [verified, setVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [returningForDeletion, setReturningForDeletion] = useState(false);
  useEffect(() => {
    setReturningForDeletion(new URLSearchParams(window.location.search).get('next') === '/account/delete');
    void (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        setMessage("Sign in to manage security.");
        return;
      }
      setEmail(data.user.email ?? "");
      setReady(true);
      const factors = await supabase.auth.mfa.listFactors();
      const existing = factors.data?.totp.find((f) => f.status === "verified");
      if (existing) {
        setFactor(existing.id);
        setVerified(true);
      }
    })();
  }, []);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }
  async function enroll() {
    const result = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "The Middleman authenticator",
    });
    if (result.error) throw result.error;
    setFactor(result.data.id);
    setQr(result.data.totp.qr_code);
    setSecret(result.data.totp.secret);
  }
  async function verify() {
    const result = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor,
      code,
    });
    if (result.error) throw result.error;
    const requestedNext = new URLSearchParams(window.location.search).get('next');
    let safeNext: string | null = null;
    if (requestedNext) {
      const target = new URL(requestedNext, window.location.origin);
      if (target.origin === window.location.origin) safeNext = `${target.pathname}${target.search}${target.hash}`;
    }
    if (safeNext) {
      window.location.assign(safeNext);
      return;
    }
    setVerified(true);
    setSecret("");
    setQr("");
    setCode("");
    setMessage("Two-step verification completed.");
  }
  return (
    <div className="mt-8 space-y-6">
      {message && (
        <p role="status" className="rounded-xl border border-line p-4">
          {message}
        </p>
      )}
      {ready && (
        <>
          <section className="rounded-2xl border border-line bg-paper p-4 sm:p-6">
            <h2 className="font-display text-xl font-semibold">
              Authenticator app
            </h2>
            <p className="mt-2 text-sm text-slate">
              {returningForDeletion
                ? "Verify a current code to continue with account deletion. You will review the final confirmation before anything is removed."
                : verified
                ? "An authenticator is enrolled. Verify a current code to access admin tools."
                : "Scan the QR code in your authenticator app, then enter its six-digit code."}
            </p>
            {!factor && (
              <button
                disabled={busy}
                onClick={() => run(enroll)}
                className="auth-button mt-5"
              >
                Set up authenticator
              </button>
            )}
            {qr && (
              <>
                <Image
                  unoptimized
                  src={qr}
                  width={220}
                  height={220}
                  alt="Authenticator enrollment QR code"
                  className="mt-4 bg-white p-3"
                />
                <p className="mt-3 break-all text-sm">
                  Manual setup key: <code>{secret}</code>
                </p>
                <p className="mt-2 text-sm text-slate">
                  Keep this key private and save it securely before continuing.
                </p>
              </>
            )}
            {factor && (
              <form
                className="mt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void run(verify);
                }}
              >
                <label htmlFor="mfa-code" className="text-sm">
                  Authenticator code
                </label>
                <input
                  id="mfa-code"
                  className="auth-input mt-2"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
                <button disabled={busy} className="auth-button mt-3">
                  Verify code
                </button>
              </form>
            )}
            {verified && (
              <Link
                href="/admin"
                className="mt-4 inline-block text-ember underline"
              >
                Open admin workspace
              </Link>
            )}
          </section>
          <section className="rounded-2xl border border-line bg-paper p-4 sm:p-6">
            <h2 className="font-display text-xl font-semibold">
              Change password
            </h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  const { error } = await supabase.auth.updateUser({
                    password,
                  });
                  if (error) throw error;
                  setPassword("");
                  setMessage("Password changed.");
                });
              }}
            >
              <label htmlFor="new-password" className="mt-4 block text-sm">
                New password (12–128 characters)
              </label>
              <span className="relative mt-2 block">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="auth-input pr-20"
                  minLength={12}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-slate hover:text-ember focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
              <button disabled={busy} className="auth-button mt-3">
                Update password
              </button>
            </form>
            <button
              className="mt-5 text-sm text-ember underline"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const { error } = await supabase.auth.signOut({
                    scope: "global",
                  });
                  if (error) throw error;
                  window.location.assign("/signup?mode=signin");
                })
              }
            >
              Sign out of all sessions
            </button>
          </section>
          <p className="text-sm text-slate">Signed in as {email}</p>
        </>
      )}
    </div>
  );
}

