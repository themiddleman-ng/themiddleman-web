"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "themiddleman-cookie-notice-v1";

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "dismissed");
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try { window.localStorage.setItem(STORAGE_KEY, "dismissed"); }
    catch { /* Browsers can block local storage; dismiss for this visit. */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie notice"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border border-line bg-paper p-4 text-bone shadow-[0_20px_60px_rgba(28,27,24,.18)] sm:left-6 sm:right-auto sm:bottom-6"
    >
      <p className="text-sm leading-relaxed text-slate">
        We use essential cookies for sign-in and security. This notice saves only your dismissal preference; it does not turn on tracking. We do not use advertising cookies.
      </p>
      <div className="mt-3 flex items-center justify-between gap-4">
        <Link href="/legal/cookies" className="text-sm font-semibold text-ember hover:underline">
          Cookie policy
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full bg-ember px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-ember/90"
        >
          Dismiss notice
        </button>
      </div>
    </aside>
  );
}
