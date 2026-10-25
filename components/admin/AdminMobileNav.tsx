"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChartPieSliceIcon } from "@phosphor-icons/react/dist/csr/ChartPieSlice";
import { DotsThreeOutlineIcon } from "@phosphor-icons/react/dist/csr/DotsThreeOutline";
import { PackageIcon } from "@phosphor-icons/react/dist/csr/Package";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/csr/UsersThree";
import { ADMIN_NAV, adminNavActive } from "./admin-nav";

const TAB_ITEMS = [
  { href: "/admin", label: "Overview", icon: ChartPieSliceIcon, tab: "overview" as const },
  { href: "/admin/products", label: "Products", icon: PackageIcon, tab: "products" as const },
  { href: "/admin/sellers", label: "Sellers", icon: UsersThreeIcon, tab: "sellers" as const },
];

export default function AdminMobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreItems = ADMIN_NAV.filter((item) => !item.mobileTab);

  return (
    <>
      {moreOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          role="presentation"
          onClick={() => setMoreOpen(false)}
        />
      ) : null}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Admin mobile navigation"
      >
        {moreOpen ? (
          <div className="border-b border-line bg-paper px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">More</p>
            <ul className="mt-2 space-y-1">
              {moreItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold ${
                      adminNavActive(pathname, item.href) ? "text-link" : "text-bone"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="grid grid-cols-4">
          {TAB_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = adminNavActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-[4rem] flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                  active ? "text-link" : "text-muted"
                }`}
              >
                <Icon size={22} weight={active ? "fill" : "regular"} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={`flex min-h-[4rem] flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              moreOpen || moreItems.some((item) => adminNavActive(pathname, item.href))
                ? "text-link"
                : "text-muted"
            }`}
            aria-expanded={moreOpen}
          >
            <DotsThreeOutlineIcon size={22} weight="regular" aria-hidden="true" />
            More
          </button>
        </div>
      </nav>
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </>
  );
}
