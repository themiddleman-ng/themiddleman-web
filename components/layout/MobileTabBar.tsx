"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { GridFourIcon } from "@phosphor-icons/react/dist/csr/GridFour";
import { HouseIcon } from "@phosphor-icons/react/dist/csr/House";
import { ChatCircleIcon } from "@phosphor-icons/react/dist/csr/ChatCircle";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { UserCircleIcon } from "@phosphor-icons/react/dist/csr/UserCircle";
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
    { href: "/marketplace", label: "Marketplace", icon: <HouseIcon size={22} weight="regular" aria-hidden="true" /> },
    { href: "/browse", label: "Browse", icon: <GridFourIcon size={22} weight="regular" aria-hidden="true" /> },
  ];
  const trailing: Tab[] = [
    { href: "/messages", label: "Messages", icon: <ChatCircleIcon size={22} weight="regular" aria-hidden="true" />, badge: unread },
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
        <UserCircleIcon size={22} weight="regular" aria-hidden="true" />
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
        className={`flex h-16 flex-col items-center justify-center gap-1 text-[14px] font-semibold tracking-wide transition-colors md:text-[10px] ${
          active ? "text-link" : "text-muted"
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
              <PlusIcon size={24} weight="bold" aria-hidden="true" />
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
