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
  useEffect(() => {
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
          <section className="rounded-2xl border border-line bg-paper p-6">
            <h2 className="font-display text-xl font-semibold">
              Authenticator app
            </h2>
            <p className="mt-2 text-sm text-slate">
              {verified
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
          <section className="rounded-2xl border border-line bg-paper p-6">
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
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                className="auth-input mt-2"
                minLength={12}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
            <p className="mt-3 text-xs text-slate">
              Existing access tokens remain valid until expiry. The isolated
              escrow preview additionally checks active admin sessions on the
              server.
            </p>
          </section>
          <p className="text-sm text-slate">Signed in as {email}</p>
        </>
      )}
    </div>
  );
}
