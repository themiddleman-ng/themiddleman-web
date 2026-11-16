"use client";

import { BellIcon } from "@phosphor-icons/react/dist/csr/Bell";
import { PackageIcon } from "@phosphor-icons/react/dist/csr/Package";
import { TruckIcon } from "@phosphor-icons/react/dist/csr/Truck";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/csr/UsersThree";

function activityIcon(action: string) {
  if (action.includes("product")) return PackageIcon;
  if (action.includes("seller")) return UsersThreeIcon;
  if (action.includes("delivery")) return TruckIcon;
  return BellIcon;
}

export default function AdminActivityList({
  rows,
}: {
  rows: { id: string; action: string; created_at: string }[];
}) {
  if (!rows.length) {
    return (
      <p className="mt-4 rounded-xl border border-line bg-elevated px-4 py-6 text-sm text-muted">
        No admin activity recorded yet.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-line">
      <div className="hidden grid-cols-[6.5rem_minmax(0,1fr)] gap-3 border-b border-line bg-elevated px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted md:grid">
        <span>Time</span>
        <span>Event</span>
      </div>
      <ul>
        {rows.map((row) => {
          const Icon = activityIcon(row.action);
          return (
            <li
              key={row.id}
              className="flex flex-col gap-1 border-b border-line px-4 py-3 last:border-b-0 md:grid md:grid-cols-[6.5rem_minmax(0,1fr)] md:items-center md:gap-3"
            >
              <time className="text-xs text-muted">
                {new Date(row.created_at).toLocaleString("en-NG", {
                  timeZone: "Africa/Lagos",
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "numeric",
                  month: "short",
                })}
              </time>
              <span className="flex items-center gap-2 text-sm">
                <Icon size={18} weight="regular" className="shrink-0 text-muted" aria-hidden="true" />
                {row.action.replace(/_/g, " ")}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
