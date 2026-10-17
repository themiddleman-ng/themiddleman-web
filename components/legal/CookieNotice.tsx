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

export default function CookieNotice() {
  const pathname = usePathname();
  const aboveTabs = TAB_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
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
          className={`fixed inset-x-0 z-50 border-t border-[#e5dbcf] bg-[#fffdf9] px-3 py-2.5 text-[#243344] shadow-[0_-8px_24px_rgba(28,37,47,.12)] sm:inset-x-auto sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-2xl sm:border sm:p-4 sm:shadow-[0_12px_36px_rgba(28,37,47,.16)] ${aboveTabs ? "bottom-[calc(4rem+env(safe-area-inset-bottom))]" : "bottom-0"}`}
        >
          <div className="mx-auto flex max-w-lg items-center gap-3 sm:block sm:max-w-none">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Cookies</p>
              <p className="mt-0.5 hidden text-xs leading-5 text-[#64717c] sm:mt-1 sm:block">
                Essential cookies keep sign-in working. You can choose whether to allow optional analytics.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link href="/legal/cookies" className="hidden text-xs font-semibold text-[#a94b18] hover:underline sm:inline">
                Cookie policy
              </Link>
              <button
                type="button"
                onClick={() => { setOptionalAnalytics(readPreferences().optionalAnalytics); setSettingsOpen(true); }}
                className="min-h-9 rounded-lg px-2.5 text-xs font-semibold text-[#465665] hover:bg-[#f5efe7]"
              >
                Choose
              </button>
              <button
                type="button"
                onClick={() => savePreferences(false)}
                className="min-h-9 rounded-lg bg-[#de641e] px-3 text-xs font-semibold text-white hover:bg-[#c95415]"
              >
                OK
              </button>
            </div>
          </div>
        </aside>
      )}

      {settingsOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-[#182d41]/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-settings-title"
            className="w-full max-w-md rounded-[24px] border border-[#e6ddd1] bg-[#fffdf9] p-5 text-[#243344] shadow-[0_24px_80px_rgba(18,34,49,.25)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#be561b]">Privacy</p>
                <h2 id="cookie-settings-title" className="mt-1 font-display text-xl font-semibold">Cookie settings</h2>
                <p className="mt-2 text-sm leading-6 text-[#64717c]">
                  Essential storage keeps your account signed in and secure. Change optional preferences below.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close cookie settings"
                onClick={() => setSettingsOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl leading-none text-[#71808d] hover:bg-[#f4eee6] hover:text-[#243344]"
              >
                ×
              </button>
            </div>

            <div className="mt-5 divide-y divide-[#eee7de] rounded-2xl border border-[#eee7de] bg-[#fbf8f3] px-4">
              <div className="flex items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-sm font-semibold">Essential</p>
                  <p className="mt-1 text-xs leading-5 text-[#697581]">Sign-in, security and saved preferences.</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#e8eee8] px-2.5 py-1 text-[11px] font-semibold text-[#46604a]">Always on</span>
              </div>

              <div className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Optional analytics</p>
                  <p className="mt-1 text-xs leading-5 text-[#697581]">
                    No analytics cookies are active yet. Your choice is saved for when optional analytics are introduced.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={optionalAnalytics}
                  aria-label="Allow optional analytics"
                  onClick={() => setOptionalAnalytics((value) => !value)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#de641e]/20 ${optionalAnalytics ? "bg-[#de641e]" : "bg-[#c9c3ba]"}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${optionalAnalytics ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            <Link href="/legal/cookies" onClick={() => setSettingsOpen(false)} className="mt-4 inline-block text-xs font-semibold text-[#a94b18] hover:underline">
              Read the cookie policy
            </Link>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => savePreferences(false)}
                className="min-h-11 rounded-xl border border-[#ddd3c8] px-4 py-2.5 text-sm font-semibold text-[#465665] transition hover:bg-[#f7f1e9]"
              >
                Only essential
              </button>
              <button
                type="button"
                onClick={() => savePreferences(optionalAnalytics)}
                className="min-h-11 rounded-xl bg-[#de641e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c95415]"
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

