"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const APP_PREFIXES = [
  "/marketplace",
  "/browse",
  "/gigs",
  "/orders",
  "/payments",
  "/messages",
  "/profile",
];

function fabAction(pathname: string): { href: string; label: string } {
  if (
    pathname.startsWith("/gigs") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/payments")
  ) {
    return { href: "/marketplace", label: "Find a product" };
  }
  return { href: "/gigs/new", label: "List a product" };
}

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
function IconBrowse() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconMessages() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H3l1.8-3.6A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}
function IconProfile() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.5 3.6-5 7-5s6.2 1.5 7 5" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function MobileTabBar() {
  const pathname = usePathname();
  const shouldShow = APP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const [visible, setVisible] = useState(true);
  const [unread, setUnread] = useState(0);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!shouldShow) return;

    setVisible(true);
    lastScrollY.current = window.scrollY;

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const difference = currentScrollY - lastScrollY.current;

      if (currentScrollY < 24) {
        setVisible(true);
      } else if (difference > 6) {
        setVisible(false);
      } else if (difference < -6) {
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shouldShow]);

  useEffect(() => {
    if (!shouldShow) return;
    let cancelled = false;

    async function loadUnreadCount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setUnread(0);
        return;
      }
      const response = await fetch('/api/conversations', { cache: 'no-store' });
      if (cancelled || !response.ok) return;
      const result = await response.json();
      setUnread(result.unreadCount ?? 0);
    }

    loadUnreadCount();
    const refresh = () => { void loadUnreadCount(); };
    window.addEventListener("messages:read-updated", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("messages:read-updated", refresh);
    };
  }, [shouldShow]);

  if (!shouldShow) return null;

  const fab = fabAction(pathname);

  const tabs: Array<
    | { href: string; label: string; icon: React.ReactNode; badge?: number }
    | null
  > = [
    { href: "/marketplace", label: "Home", icon: <IconHome /> },
    { href: "/browse", label: "Browse", icon: <IconBrowse /> },
    null,
    { href: "/messages", label: "Messages", icon: <IconMessages />, badge: unread },
    { href: "/profile", label: "Profile", icon: <IconProfile /> },
  ];

  return (
    <>
      {/* In-flow spacer so the fixed bar never covers content */}
      <div className="h-20 md:hidden" aria-hidden="true" />

      <nav
        className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out md:hidden ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile navigation"
      >
        <div className="border-t border-[#2A2A2A] bg-[#141414]/95 backdrop-blur-xl">
          <div className="grid grid-cols-5">
            {tabs.map((tab, i) => {
              if (tab === null) {
                return (
                  <div key="fab" className="relative flex justify-center">
                    <Link
                      href={fab.href}
                      aria-label={fab.label}
                      className="absolute -top-6 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#141414] bg-ember text-ink shadow-[0_10px_30px_rgba(242,100,25,.45)] transition-transform active:scale-95"
                    >
                      <IconPlus />
                    </Link>
                  </div>
                );
              }
              const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold tracking-wide transition-colors ${
                    active ? "text-ember" : "text-slate"
                  }`}
                >
                  <span className="relative">
                    {tab.icon}
                    {tab.badge ? (
                      <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[9px] font-bold text-ink">
                        {tab.badge > 9 ? "9+" : tab.badge}
                      </span>
                    ) : null}
                  </span>
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
