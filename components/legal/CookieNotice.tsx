"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "themiddleman-cookie-preferences-v2";
const LEGACY_KEY = "themiddleman-cookie-notice-v1";

type CookiePreferences = {
  essential: true;
  optionalAnalytics: boolean;
};

function readPreferences(): CookiePreferences {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { essential: true, optionalAnalytics: false };
    const parsed = JSON.parse(stored) as Partial<CookiePreferences>;
    return { essential: true, optionalAnalytics: parsed.optionalAnalytics === true };
  } catch {
    return { essential: true, optionalAnalytics: false };
  }
}

const TAB_PREFIXES = ["/marketplace", "/browse", "/gigs", "/orders", "/payments", "/messages", "/profile", "/settings"];

function isProductPath(pathname: string) {
  return /^\/gigs\/(?!new$|mine$)[^/]+/.test(pathname);
}

export default function CookieNotice() {
  const pathname = usePathname();
  const aboveTabs = TAB_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const aboveBuyBar = isProductPath(pathname);
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [optionalAnalytics, setOptionalAnalytics] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setOptionalAnalytics(readPreferences().optionalAnalytics);
        setVisible(false);
      } else if (window.localStorage.getItem(LEGACY_KEY) === "dismissed") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ essential: true, optionalAnalytics: false }));
        setVisible(false);
      } else {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }

    const openSettings = () => {
      setOptionalAnalytics(readPreferences().optionalAnalytics);
      setSettingsOpen(true);
    };
    window.addEventListener("middleman:cookies-open", openSettings);
    return () => window.removeEventListener("middleman:cookies-open", openSettings);
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [settingsOpen]);

  function savePreferences(nextOptionalAnalytics: boolean) {
    const preferences: CookiePreferences = {
      essential: true,
      optionalAnalytics: nextOptionalAnalytics,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      window.localStorage.setItem(LEGACY_KEY, "dismissed");
    } catch {
      // Keep the choice for this visit even if browser storage is blocked.
    }
    setOptionalAnalytics(nextOptionalAnalytics);
    setVisible(false);
    setSettingsOpen(false);
  }

  return (
    <>
      {visible && (
        <aside
          aria-label="Cookie notice"
          className={`fixed inset-x-0 z-50 border-t border-line bg-paper text-bone shadow-[0_-6px_18px_rgba(0,0,0,.35)] ${
            aboveBuyBar
              ? "bottom-[calc(9.25rem+env(safe-area-inset-bottom))] md:bottom-0"
              : aboveTabs
                ? "bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0"
                : "bottom-0"
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
            <p className="min-w-0 flex-1 truncate text-[13px] leading-5 text-bone">
              Essential cookies keep sign-in working.{" "}
              <Link href="/legal/cookies" className="font-semibold text-ember hover:underline">
                Cookie policy
              </Link>
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => { setOptionalAnalytics(readPreferences().optionalAnalytics); setSettingsOpen(true); }}
                className="min-h-9 rounded-lg px-2.5 text-xs font-semibold text-bone hover:bg-elevated"
              >
                Choose
              </button>
              <button
                type="button"
                onClick={() => savePreferences(false)}
                className="min-h-9 rounded-lg bg-ember px-3 text-xs font-semibold text-on-ember hover:opacity-90"
              >
                OK
              </button>
            </div>
          </div>
        </aside>
      )}

      {!visible && !settingsOpen && (
        <button
          type="button"
          onClick={() => { setOptionalAnalytics(readPreferences().optionalAnalytics); setSettingsOpen(true); }}
          className={`fixed left-3 z-40 inline-flex min-h-11 items-center rounded-full border border-line bg-paper px-3 text-[14px] font-semibold text-bone shadow-sm hover:bg-elevated ${
            aboveBuyBar
              ? "bottom-[calc(9.25rem+env(safe-area-inset-bottom))] md:bottom-4"
              : aboveTabs
                ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-4"
                : "bottom-4"
          }`}
        >
          Cookie settings
        </button>
      )}

      {settingsOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-settings-title"
            className="w-full max-w-md rounded-[24px] border border-line bg-paper p-5 text-bone shadow-[0_24px_80px_rgba(0,0,0,.45)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-ember">Privacy</p>
                <h2 id="cookie-settings-title" className="mt-1 font-display text-xl font-semibold">Cookie settings</h2>
                <p className="mt-2 text-sm leading-6 text-slate">
                  Essential storage keeps your account signed in and secure. Change optional preferences below.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close cookie settings"
                onClick={() => setSettingsOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl leading-none text-slate hover:bg-elevated hover:text-bone"
              >
                ×
              </button>
            </div>

            <div className="mt-5 divide-y divide-line rounded-2xl border border-line bg-elevated px-4">
              <div className="flex items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-sm font-semibold">Essential</p>
                  <p className="mt-1 text-xs leading-5 text-slate">Sign-in, security and saved preferences.</p>
                </div>
                <span className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-slate">Always on</span>
              </div>

              <div className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Optional analytics</p>
                  <p className="mt-1 text-xs leading-5 text-slate">
                    No analytics cookies are active yet. Your choice is saved for when optional analytics are introduced.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={optionalAnalytics}
                  aria-label="Allow optional analytics"
                  onClick={() => setOptionalAnalytics((value) => !value)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ember/20 ${optionalAnalytics ? "bg-ember" : "bg-line"}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-bone shadow-sm transition-transform ${optionalAnalytics ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            <Link href="/legal/cookies" onClick={() => setSettingsOpen(false)} className="mt-4 inline-flex min-h-11 items-center text-[14px] font-semibold text-eyebrow hover:underline">
              Read the cookie policy
            </Link>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => savePreferences(false)}
                className="min-h-11 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-bone transition hover:bg-elevated"
              >
                Only essential
              </button>
              <button
                type="button"
                onClick={() => savePreferences(optionalAnalytics)}
                className="min-h-11 rounded-xl bg-ember px-4 py-2.5 text-sm font-semibold text-on-ember transition hover:opacity-90"
              >
                Save choice
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
