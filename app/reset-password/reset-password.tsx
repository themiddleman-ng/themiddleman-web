"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
export default function ResetPassword() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [recovery, setRecovery] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (recovery) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setPassword("");
        setMessage("Password updated. You can sign in.");
      } else {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        setMessage(
          "If the account exists, a reset link has been requested. Check your email.",
        );
      }
    } catch {
      setMessage(
        "Unable to update password. Request a fresh reset link and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  // PKCE recovery returns a server session through /auth/callback; the query
  // selects the form, while Supabase still authorizes the actual password update.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("recovery") === "true")
      setRecovery(true);
  }, []);
  return (
    <form onSubmit={submit} className="mt-6">
      <label htmlFor="reset-value">
        {recovery ? "New password (12–128 characters)" : "Email address"}
      </label>
      <input
        id="reset-value"
        type={recovery ? "password" : "email"}
        className="auth-input mt-2"
        value={recovery ? password : email}
        onChange={(e) =>
          recovery ? setPassword(e.target.value) : setEmail(e.target.value)
        }
        autoComplete={recovery ? "new-password" : "email"}
        minLength={recovery ? 12 : undefined}
        maxLength={recovery ? 128 : 254}
        required
      />
      <button disabled={busy} className="auth-button mt-4">
        {busy
          ? "Please wait…"
          : recovery
            ? "Update password"
            : "Send reset link"}
      </button>
      {message && (
        <p role="status" className="mt-4 text-sm">
          {message}
        </p>
      )}
      <Link href="/signup?mode=signin" className="mt-5 block text-ember">
        Back to sign in
      </Link>
    </form>
  );
}
