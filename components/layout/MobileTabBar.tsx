"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import OwnerAvatar from "@/components/profile/OwnerAvatar";
import { useOwnerAvatar } from "@/lib/profile/use-owner-avatar";

const APP_PREFIXES = [
  "/marketplace",
  "/browse",
  "/gigs",
  "/orders",
  "/payments",
  "/messages",
  "/profile",
  "/settings",
];

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

type Tab = { href: string; label: string; icon: ReactNode; badge?: number };

export default function MobileTabBar() {
  const pathname = usePathname();
  const shouldShow = APP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const [unread, setUnread] = useState(0);
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, unknown> } | null>(null);
  const ownerAvatar = useOwnerAvatar(user);

  useEffect(() => {
    if (!shouldShow) return;
    let cancelled = false;

    async function loadUnreadCount() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(authUser);
      if (!authUser) {
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setUnread(0);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("messages:read-updated", refresh);
    };
  }, [shouldShow]);

  if (!shouldShow) return null;

  const creatingProduct = pathname.startsWith("/gigs/new");
  const showCreateButton = Boolean(user?.id) && !creatingProduct;

  const leading: Tab[] = [
    { href: "/marketplace", label: "Marketplace", icon: <IconHome /> },
    { href: "/browse", label: "Browse", icon: <IconBrowse /> },
  ];
  const trailing: Tab[] = [
    { href: "/messages", label: "Messages", icon: <IconMessages />, badge: unread },
    {
      href: "/profile",
      label: "Profile",
      icon: user ? (
        <OwnerAvatar
          url={ownerAvatar.url}
          name={typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null}
          email={user.email}
          size={22}
        />
      ) : (
        <IconProfile />
      ),
    },
  ];

  function renderTab(tab: Tab) {
    const active = pathname.startsWith("/settings")
      ? tab.href === "/profile"
      : tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
    return (
      <Link
        key={tab.href}
        href={tab.href}
        data-onboarding-target={tab.href === "/profile" || tab.href === "/messages" ? tab.href.slice(1) : undefined}
        aria-current={active ? "page" : undefined}
        className={`flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold tracking-wide transition-colors ${
          active ? "text-ember" : "text-slate"
        }`}
      >
        <span className="relative">
          {tab.icon}
          {tab.badge ? (
            <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[9px] font-bold text-on-ember">
              {tab.badge > 9 ? "9+" : tab.badge}
            </span>
          ) : null}
        </span>
        {tab.label}
      </Link>
    );
  }

  return (
    <>
      <div
        className="md:hidden"
        style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }}
        aria-hidden="true"
      />

      <nav
        className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile navigation"
      >
        <div className="relative border-t border-line bg-paper/96 shadow-[0_-8px_24px_rgba(0,0,0,.4)] backdrop-blur-xl">
          {showCreateButton ? (
            <Link
              href="/gigs/new"
              aria-label="List a product"
              className="absolute left-1/2 top-0 z-10 flex h-[3.25rem] w-[3.25rem] -translate-x-1/2 -translate-y-[42%] items-center justify-center rounded-full border-[3px] border-paper bg-ember text-on-ember shadow-[0_10px_24px_rgba(242,100,25,.32)] transition-transform active:scale-95"
            >
              <IconPlus />
            </Link>
          ) : null}
          <div className={`grid ${showCreateButton ? "grid-cols-5" : "grid-cols-4"}`}>
            {leading.map(renderTab)}
            {showCreateButton ? <div aria-hidden="true" /> : null}
            {trailing.map(renderTab)}
          </div>
        </div>
      </nav>
    </>
  );
}
