"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise";

export default function AdminOverviewToolbar({ overviewDate }: { overviewDate: string }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      router.refresh();
      await new Promise((resolve) => window.setTimeout(resolve, 400));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <header className="border-b border-line pb-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Operations overview</h1>
          <p className="mt-1 text-sm text-muted">{overviewDate} · Live workspace data</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-paper px-4 text-sm font-semibold disabled:opacity-50"
        >
          <ArrowClockwiseIcon size={18} weight="regular" className={refreshing ? "motion-safe:animate-spin" : ""} aria-hidden="true" />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </header>
  );
}
