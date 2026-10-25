"use client";

import Link from "next/link";
import { BellIcon } from "@phosphor-icons/react/dist/csr/Bell";
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import { PackageIcon } from "@phosphor-icons/react/dist/csr/Package";
import { TruckIcon } from "@phosphor-icons/react/dist/csr/Truck";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/csr/UsersThree";

const ICONS = {
  package: PackageIcon,
  users: UsersThreeIcon,
  delivery: TruckIcon,
  notifications: BellIcon,
} as const;

export type AdminStatIcon = keyof typeof ICONS;

export default function AdminStatCard({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value: number;
  href?: string;
  icon: AdminStatIcon;
}) {
  const Icon = ICONS[icon];
  const body = (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-line bg-paper p-4 shadow-sm">
      <div>
        <span className="mb-3 inline-flex text-muted">
          <Icon size={22} weight="regular" aria-hidden="true" />
        </span>
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-1 font-display text-3xl font-bold text-ember-cta">{value}</p>
      </div>
      {href ? (
        <CaretRightIcon size={18} weight="regular" className="mt-1 shrink-0 text-muted" aria-hidden="true" />
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-95">
        {body}
      </Link>
    );
  }
  return body;
}
