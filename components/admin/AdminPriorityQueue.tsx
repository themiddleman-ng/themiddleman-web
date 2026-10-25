"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ProductCover from "@/components/marketplace/ProductCover";
import { formatWaitingSince } from "@/lib/admin/format-waiting";
import { downloadCsv } from "@/lib/client/download-csv";
import type { AdminQueueKind, AdminQueueRow } from "./admin-queue";

function QueueTypePill({ kind }: { kind: AdminQueueKind }) {
  const tone =
    kind === "seller"
      ? "bg-sky-50 text-sky-800 border-sky-200"
      : kind === "delivery"
        ? "bg-zinc-100 text-zinc-700 border-zinc-200"
        : "bg-orange-50 text-orange-800 border-orange-200";
  const label = kind === "seller" ? "Seller" : kind === "delivery" ? "Delivery review" : "Product";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}

function kindLabel(kind: AdminQueueKind) {
  return kind === "seller" ? "Seller" : kind === "delivery" ? "Delivery review" : "Product";
}

export default function AdminPriorityQueue({ rows }: { rows: AdminQueueRow[] }) {
  const [filter, setFilter] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      `${row.title} ${row.detail} ${kindLabel(row.kind)}`.toLowerCase().includes(needle),
    );
  }, [filter, rows]);

  const visible = showAll ? filtered : filtered.slice(0, 10);
  const mobileVisible = showAll ? filtered : filtered.slice(0, 8);

  function exportQueue() {
    downloadCsv("middleman-priority-queue.csv", [
      ["Type", "Item", "Detail", "Waiting", "Review path"],
      ...filtered.map((row) => [
        kindLabel(row.kind),
        row.title,
        row.detail,
        formatWaitingSince(row.since),
        row.href,
      ]),
    ]);
  }

  return (
    <section className="mt-8" aria-labelledby="priority-queue-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="priority-queue-title" className="font-display text-lg font-semibold">Priority queue</h2>
        <div className="flex flex-wrap items-center gap-2">
          {filtered.length > 10 ? (
            <button
              type="button"
              onClick={() => setShowAll((open) => !open)}
              className="min-h-11 rounded-lg px-3 text-sm font-semibold text-link hover:underline"
            >
              {showAll ? "Show fewer" : `View all (${filtered.length})`}
            </button>
          ) : null}
          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={exportQueue}
            className="min-h-11 rounded-lg border border-line bg-paper px-3 text-sm font-semibold disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <label className="mb-4 block text-sm">
        <span className="font-medium text-muted">Filter queue</span>
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Search by title, type, or reference"
          className="auth-input mt-2 min-h-11 w-full max-w-md"
        />
      </label>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-line bg-elevated px-4 py-8 text-center text-sm text-muted" role="status">
          {rows.length === 0
            ? "Nothing is waiting in the priority queue right now."
            : "No queue items match that filter."}
        </p>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-line md:block">
            <div className="grid grid-cols-[7rem_minmax(0,1fr)_7rem_6.5rem] gap-3 border-b border-line bg-elevated px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <span>Type</span>
              <span>Item</span>
              <span>Waiting time</span>
              <span className="text-right">Action</span>
            </div>
            {visible.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[7rem_minmax(0,1fr)_7rem_6.5rem] items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
              >
                <QueueTypePill kind={row.kind} />
                <div className="flex min-w-0 items-center gap-3">
                  {row.thumb ? (
                    <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-md border border-line bg-elevated">
                      <ProductCover title={row.thumb.title} category={row.thumb.category} compact />
                    </div>
                  ) : (
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-elevated text-xs font-bold">
                      {(row.title.slice(0, 2) || "?").toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{row.title}</p>
                    <p className="truncate text-xs text-muted">{row.detail}</p>
                  </div>
                </div>
                <span className="text-sm text-muted">{formatWaitingSince(row.since)}</span>
                <Link
                  href={row.href}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ember-cta px-3 text-center text-sm font-semibold text-on-ember hover:bg-ember-hover"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>

          <div className="space-y-3 md:hidden">
            {mobileVisible.map((row) => (
              <article key={row.id} className="rounded-xl border border-line p-4">
                <div className="flex items-start gap-3">
                  {row.thumb ? (
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md border border-line">
                      <ProductCover title={row.thumb.title} category={row.thumb.category} compact />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <QueueTypePill kind={row.kind} />
                    <p className="mt-2 font-semibold">{row.title}</p>
                    <p className="text-xs text-muted">{row.detail}</p>
                    <p className="mt-1 text-xs text-muted">Waiting {formatWaitingSince(row.since)}</p>
                  </div>
                </div>
                <Link
                  href={row.href}
                  className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg bg-ember-cta text-sm font-semibold text-on-ember"
                >
                  Review
                </Link>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
