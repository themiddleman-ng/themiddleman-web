"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { ChartPieSliceIcon } from "@phosphor-icons/react/dist/csr/ChartPieSlice";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/csr/EnvelopeSimple";
import { PackageIcon } from "@phosphor-icons/react/dist/csr/Package";
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/csr/ShieldCheck";
import { TruckIcon } from "@phosphor-icons/react/dist/csr/Truck";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/csr/UsersThree";
import AdminMobileNav from "./AdminMobileNav";
import { ADMIN_NAV, adminNavActive } from "./admin-nav";

const ICONS: Record<string, typeof PackageIcon> = {
  "/admin": ChartPieSliceIcon,
  "/admin/products": PackageIcon,
  "/admin/sellers": UsersThreeIcon,
  "/admin/review": TruckIcon,
  "/admin/escrow": ShieldCheckIcon,
  "/admin/communications": EnvelopeSimpleIcon,
  "/admin/email-preview": EnvelopeSimpleIcon,
};

export default function AdminWorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <main className="min-h-screen bg-[#ECEFF3] text-bone">
      <SiteHeader />
      <div className="mx-auto flex max-w-[90rem] gap-6 px-4 py-6 md:px-6 md:py-8 lg:px-8">
        <aside
          className="hidden w-[13.5rem] shrink-0 flex-col rounded-xl bg-[#1C252C] p-3 lg:flex"
          aria-label="Admin navigation"
        >
          <p className="px-2 pb-3 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#AEB8C0]">
            Admin workspace
          </p>
          <nav className="flex flex-col gap-0.5">
            {ADMIN_NAV.map((item) => {
              const active = adminNavActive(pathname, item.href);
              const Icon = ICONS[item.href] ?? PackageIcon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-11 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors ${
                    active
                      ? "border-l-[3px] border-ember-cta bg-[#33414B] pl-[calc(0.625rem-3px)] text-white"
                      : "text-[#E9EEF2] hover:bg-[#2a343d]"
                  }`}
                >
                  <Icon size={20} weight="regular" className="shrink-0 opacity-90" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <AdminMobileNav />
    </main>
  );
}
