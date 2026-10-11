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
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 mx-auto max-w-sm rounded-xl border border-line bg-paper px-3.5 py-3 text-bone shadow-[0_12px_36px_rgba(28,27,24,.16)] sm:bottom-4 sm:left-4 sm:right-auto"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink">Cookies</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate">
            Essential cookies help sign-in and security work.
          </p>
          <Link href="/legal/cookies" className="mt-1 inline-block text-xs font-semibold text-ember hover:underline">
            Cookie policy
          </Link>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ember/50"
        >
          Got it
        </button>
      </div>
    </aside>
  );
}
