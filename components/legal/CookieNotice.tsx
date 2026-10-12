"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "themiddleman-cookie-preferences-v2";
const LEGACY_KEY = "themiddleman-cookie-notice-v1";

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
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

    const openSettings = () => setSettingsOpen(true);
    window.addEventListener("middleman:cookies-open", openSettings);
    return () => window.removeEventListener("middleman:cookies-open", openSettings);
  }, []);

  function saveEssentialChoice() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ essential: true, optionalAnalytics: false }));
      window.localStorage.setItem(LEGACY_KEY, "dismissed");
    } catch {
      // The controls remain usable for the current visit if storage is blocked.
    }
    setVisible(false);
    setSettingsOpen(false);
  }

  return (
    <>
      {visible && (
        <aside
          aria-label="Cookie notice"
          className="fixed bottom-[calc(8.25rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 mx-auto max-w-sm rounded-2xl border border-[#e5dbcf] bg-[#fffdf9] px-4 py-3.5 text-[#243344] shadow-[0_12px_36px_rgba(28,37,47,.16)] sm:bottom-4 sm:left-4 sm:right-auto"
        >
          <p className="text-sm font-semibold">Essential cookies only</p>
          <p className="mt-1 text-xs leading-5 text-[#64717c]">They keep sign-in and security features working. Optional tracking is not active.</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Link href="/legal/cookies" className="text-xs font-semibold text-[#a94b18] hover:underline">Cookie policy</Link>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setSettingsOpen(true)} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-[#465665] hover:bg-[#f5efe7]">Settings</button>
              <button type="button" onClick={saveEssentialChoice} className="rounded-lg bg-[#de641e] px-3 py-2 text-xs font-semibold text-white hover:bg-[#c95415]">Got it</button>
            </div>
          </div>
        </aside>
      )}

      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        aria-label="Manage cookie settings"
        className="fixed bottom-[calc(5.1rem+env(safe-area-inset-bottom))] left-3 z-40 rounded-full border border-[#e7ded3] bg-[#fffdf9]/95 px-3 py-2 text-[11px] font-semibold text-[#5a6875] shadow-sm backdrop-blur-md transition hover:border-[#d96b2b]/50 hover:text-[#a94b18] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#de641e]/15 sm:bottom-4 sm:left-4"
      >
        Manage cookies
      </button>

      {settingsOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#182d41]/35 p-3 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title" className="w-full max-w-md rounded-2xl border border-[#e6ddd1] bg-[#fffdf9] p-5 text-[#243344] shadow-[0_24px_80px_rgba(18,34,49,.25)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="cookie-settings-title" className="font-display text-xl font-semibold">Cookie settings</h2>
                <p className="mt-2 text-sm leading-6 text-[#64717c]">Essential storage keeps your account signed in and helps protect it.</p>
              </div>
              <button type="button" aria-label="Close cookie settings" onClick={() => setSettingsOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#71808d] hover:bg-[#f4eee6] hover:text-[#243344]">×</button>
            </div>
            <div className="mt-5 divide-y divide-[#eee7de] rounded-xl bg-[#f8f4ee] px-4">
              <div className="flex items-start justify-between gap-3 py-3.5">
                <div><p className="text-sm font-semibold">Essential</p><p className="mt-1 text-xs leading-5 text-[#697581]">Sign-in, security and your saved preference.</p></div>
                <span className="mt-0.5 shrink-0 text-xs font-semibold text-[#51616f]">Always on</span>
              </div>
              <div className="py-3.5">
                <p className="text-sm font-semibold">Optional tracking</p>
                <p className="mt-1 text-xs leading-5 text-[#697581]">No optional analytics cookies are currently active.</p>
              </div>
            </div>
            <Link href="/legal/cookies" onClick={() => setSettingsOpen(false)} className="mt-4 inline-block text-xs font-semibold text-[#a94b18] hover:underline">Read the cookie policy</Link>
            <button type="button" onClick={saveEssentialChoice} className="mt-5 min-h-11 w-full rounded-xl bg-[#de641e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#c95415]">Save essential settings</button>
          </section>
        </div>
      )}
    </>
  );
}
