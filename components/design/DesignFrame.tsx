"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAdminAccount } from "@/lib/account/use-admin-account";
import { supabase } from "@/lib/supabaseClient";
import { UserCircleIcon } from '@phosphor-icons/react/dist/csr/UserCircle';
import { PackageIcon } from '@phosphor-icons/react/dist/csr/Package';
import { ChartBarIcon } from '@phosphor-icons/react/dist/csr/ChartBar';
import { ChatCircleIcon } from '@phosphor-icons/react/dist/csr/ChatCircle';
import { GearSixIcon } from '@phosphor-icons/react/dist/csr/GearSix';
import { CreditCardIcon } from '@phosphor-icons/react/dist/csr/CreditCard';
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/csr/ShieldCheck';
import { BellIcon } from '@phosphor-icons/react/dist/csr/Bell';
import { PlusCircleIcon } from '@phosphor-icons/react/dist/csr/PlusCircle';
const railIcons: Record<string, typeof PackageIcon> = { '/profile': UserCircleIcon, '/messages': ChatCircleIcon, '/settings': GearSixIcon, '/payments': CreditCardIcon, '/security': ShieldCheckIcon, '/notifications': BellIcon, '/analytics': ChartBarIcon, '/admin': ChartBarIcon, '/gigs/new': PlusCircleIcon };

const account = [["/profile", "Your profile"], ["/orders", "Orders"], ["/messages", "Messages"], ["/payments", "Payments"], ["/notifications", "Notifications"], ["/settings", "Settings"], ["/security", "Security"]];
const seller = [["/gigs/mine", "My products"], ["/gigs/new", "Create a product"], ["/analytics", "Analytics"], ["/seller-support", "Seller support"]];
const admin = [["/admin", "Overview"], ["/admin/products", "Products"], ["/admin/sellers", "Sellers"], ["/admin/review", "Delivery reviews"], ["/admin/escrow", "Trust & payouts"], ["/admin/communications", "Communications"], ["/admin/email-preview", "Email previews"]];

export default function DesignFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const isAdminAccount = useAdminAccount(userId);
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setUserId(data.user?.id ?? null);
    });
    return () => { active = false; };
  }, []);
  if (pathname === "/" || pathname === "/design-review") return children;
  const onAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const showAdminRail = onAdminPath && isAdminAccount;
  const isSeller = pathname === "/analytics" || pathname === "/seller-support" || pathname === "/gigs/mine" || pathname === "/gigs/new";
  const hasRail = showAdminRail || isSeller || account.some(([href]) => pathname === href) || pathname === "/account/delete";
  // Messaging keeps the full width for the inbox and conversation panes.
  const rail = hasRail && pathname !== "/messages";
  const family = pathname.split("/").filter(Boolean)[0] || "page";
  const links = showAdminRail ? admin : isSeller ? seller : account;
  return <div className={`mm-design mm-${family}${rail ? " mm-with-rail" : ""}`}>
    {rail && <aside className="mm-workspace-rail" aria-label={showAdminRail ? "Administration" : isSeller ? "Creator workspace" : "Account navigation"}>
      <p className="mm-rail-label">{showAdminRail ? "ADMIN WORKSPACE" : isSeller ? "CREATOR WORKSPACE" : "YOUR ACCOUNT"}</p>
      <nav>{links.map(([href, label]) => { const Icon = railIcons[href] || PackageIcon; return <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}><Icon size={19} weight="regular" aria-hidden="true" />{label}</Link>; })}</nav>
      <div className="mm-rail-footer"><Link href="/marketplace">Explore marketplace</Link><Link href="/onboarding/role">Buy and sell</Link></div>
    </aside>}
    {children}
  </div>;
}
