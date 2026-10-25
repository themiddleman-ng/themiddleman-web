import Link from "next/link";
import AdminActivityList from "@/components/admin/AdminActivityList";
import AdminStatCard, { type AdminStatIcon } from "@/components/admin/AdminStatCard";
import AdminWorkspaceShell from "@/components/admin/AdminWorkspaceShell";
import ProductCover from "@/components/marketplace/ProductCover";
import { formatWaitingSince } from "@/lib/admin/format-waiting";
import { requireAdminPage } from "@/lib/server/admin-page";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";
import NotificationRetryButton from "./notification-retry-button";

export const dynamic = "force-dynamic";

const FLOW = [
  ["pending_payment", "Awaiting payment"],
  ["in_escrow", "In escrow"],
  ["delivered", "Delivered"],
  ["approved", "Completed"],
  ["disputed", "Disputed"],
  ["refunded", "Refunded"],
] as const;

type QueueKind = "product" | "seller" | "delivery";

type QueueRow = {
  id: string;
  kind: QueueKind;
  title: string;
  detail: string;
  since: string;
  href: string;
  thumb?: { title: string; category: string; imageUrl?: string };
};

function QueueTypePill({ kind }: { kind: QueueKind }) {
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

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "sent"
      ? "border-emerald-500/30 text-emerald-700"
      : status === "failed"
        ? "border-red-500/30 text-red-700"
        : "border-amber-500/30 text-amber-800";
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function AdminPage() {
  const administrator = await requireAdminPage();
  const db = administrator.db;
  const packagesOn = productPackagesEnabled();

  const [
    deliveryCount,
    deliveryRows,
    productVersionCount,
    productQueue,
    sellerPendingCount,
    sellerQueue,
    notifications,
    audit,
    orders,
    payments,
    disputes,
    reports,
    adminSetting,
  ] = await Promise.all([
    db.from("deliveries").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    db
      .from("deliveries")
      .select("id,order_id,created_at,orders(amount,gigs(title,category,gallery_image_paths))")
      .eq("status", "pending_review")
      .order("created_at", { ascending: true })
      .limit(12),
    packagesOn
      ? db
          .from("product_versions")
          .select("id", { count: "exact", head: true })
          .eq("review_status", "awaiting_review")
      : db.from("gigs").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    packagesOn
      ? db
          .from("product_versions")
          .select("id,gig_id,uploaded_at,gigs(title,category,gallery_image_paths)")
          .eq("review_status", "awaiting_review")
          .order("uploaded_at", { ascending: true })
          .limit(12)
      : db
          .from("gigs")
          .select("id,title,category,gallery_image_paths,updated_at")
          .eq("status", "pending_review")
          .order("updated_at", { ascending: true })
          .limit(12),
    db
      .from("seller_profiles")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "pending"),
    db
      .from("seller_profiles")
      .select("id,display_name,created_at")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: true })
      .limit(12),
    db
      .from("email_notifications")
      .select("id,order_id,recipient_role,recipient_email,status,attempts,last_error,updated_at")
      .order("updated_at", { ascending: false })
      .limit(24),
    db.from("admin_audit_log").select("id,action,created_at").order("created_at", { ascending: false }).limit(12),
    db.from("orders").select("id,status,amount,created_at").order("created_at", { ascending: false }).limit(200),
    db
      .from("payments")
      .select("id,order_id,amount,escrow_status,payout_status,created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    db
      .from("disputes")
      .select("id,order_id,reason,created_at", { count: "exact" })
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(6),
    db
      .from("gig_reports")
      .select("id,gig_id,reason,created_at", { count: "exact" })
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(6),
    db.from("platform_settings").select("value").eq("key", "admin_notification_email").maybeSingle(),
  ]);

  const comms = notifications.data ?? [];
  const notificationFailures = comms.filter((row) => row.status === "failed").length;
  const productsAwaiting = productVersionCount.count ?? 0;
  const sellersAwaiting = sellerPendingCount.count ?? 0;
  const deliveriesAwaiting = deliveryCount.count ?? 0;

  const queue: QueueRow[] = [];

  for (const row of productQueue.data ?? []) {
    if (packagesOn && "gig_id" in row) {
      const version = row as {
        id: string;
        gig_id: string;
        uploaded_at: string;
        gigs: { title: string; category: string } | { title: string; category: string }[] | null;
      };
      const gig = relationOne(version.gigs);
      const title = gig?.title ?? "Product listing";
      queue.push({
        id: `product-${version.id}`,
        kind: "product",
        title,
        detail: `#${version.gig_id.slice(0, 8)}`,
        since: version.uploaded_at,
        href: "/admin/products",
        thumb: { title, category: gig?.category ?? "development" },
      });
    } else {
      const gigRow = row as { id: string; title: string; category: string; updated_at: string };
      queue.push({
        id: `product-${gigRow.id}`,
        kind: "product",
        title: gigRow.title,
        detail: `#${gigRow.id.slice(0, 8)}`,
        since: gigRow.updated_at,
        href: "/admin/products",
        thumb: { title: gigRow.title, category: gigRow.category ?? "development" },
      });
    }
  }

  for (const seller of sellerQueue.data ?? []) {
    queue.push({
      id: `seller-${seller.id}`,
      kind: "seller",
      title: seller.display_name ?? "Seller application",
      detail: "Verification pending",
      since: seller.created_at,
      href: "/admin/sellers",
    });
  }

  for (const delivery of deliveryRows.data ?? []) {
    const order = relationOne(
      delivery.orders as
        | { gigs: { title: string; category: string; gallery_image_paths?: string[] } | { title: string; category: string }[] | null }
        | { gigs: { title: string; category: string; gallery_image_paths?: string[] } | { title: string; category: string }[] | null }[]
        | null,
    );
    const gig = relationOne(order?.gigs ?? null);
    queue.push({
      id: `delivery-${delivery.id}`,
      kind: "delivery",
      title: gig?.title ?? "Delivery submission",
      detail: `Order ${delivery.order_id.slice(0, 8)}`,
      since: delivery.created_at,
      href: "/admin/review",
      thumb: gig
        ? { title: gig.title, category: gig.category ?? "development" }
        : undefined,
    });
  }

  queue.sort((a, b) => Date.parse(a.since) - Date.parse(b.since));

  const orderRows = orders.data ?? [];
  const counts: Record<string, number> = {};
  for (const [key] of FLOW) counts[key] = orderRows.filter((row) => row.status === key).length;

  const overviewDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });

  const statCards: { label: string; value: number; href: string; icon: AdminStatIcon }[] = [];
  if (productsAwaiting > 0 || packagesOn) {
    statCards.push({
      label: "Products awaiting review",
      value: productsAwaiting,
      href: "/admin/products",
      icon: "package",
    });
  }
  statCards.push(
    {
      label: "Seller applications",
      value: sellersAwaiting,
      href: "/admin/sellers",
      icon: "users",
    },
    {
      label: "Delivery reviews",
      value: deliveriesAwaiting,
      href: "/admin/review",
      icon: "delivery",
    },
  );
  if (notificationFailures > 0 || comms.length > 0) {
    statCards.push({
      label: "Notification failures",
      value: notificationFailures,
      href: "/admin/communications",
      icon: "notifications",
    });
  }

  return (
    <AdminWorkspaceShell>
      <div className="rounded-2xl border border-line bg-paper p-5 shadow-sm md:p-7">
        <header className="border-b border-line pb-5">
          <h1 className="font-display text-2xl font-bold md:text-3xl">Operations overview</h1>
          <p className="mt-1 text-sm text-muted">{overviewDate} · Live workspace data</p>
        </header>

        {statCards.length > 0 ? (
          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Operations metrics">
            {statCards.map((card) => (
              <AdminStatCard key={card.label} {...card} />
            ))}
          </section>
        ) : null}

        <section className="mt-8" aria-labelledby="priority-queue-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="priority-queue-title" className="font-display text-lg font-semibold">Priority queue</h2>
            <Link href="/admin/review" className="text-sm font-semibold text-link hover:underline">
              View all
            </Link>
          </div>

          {queue.length === 0 ? (
            <p className="rounded-xl border border-line bg-elevated px-4 py-8 text-center text-sm text-muted">
              Nothing is waiting in the priority queue right now.
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
                {queue.slice(0, 10).map((row) => (
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
                {queue.slice(0, 8).map((row) => (
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

        <section className="mt-10" aria-labelledby="recent-activity-title">
          <h2 id="recent-activity-title" className="font-display text-lg font-semibold">Recent activity</h2>
          <AdminActivityList rows={audit.data ?? []} />
        </section>

        <details className="mt-10 rounded-xl border border-line bg-elevated p-4 open:bg-paper">
          <summary className="cursor-pointer text-sm font-semibold text-bone">Detailed operations &amp; email health</summary>
          <div className="mt-6 grid gap-8 xl:grid-cols-[1.25fr_.75fr]">
            <section>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-link">Communications</p>
              <h3 className="mt-2 font-display text-xl font-semibold">Transactional email health</h3>
              <p className="mt-2 text-xs text-muted">
                Operations inbox: {adminSetting.data?.value ?? "Not configured"}
              </p>
              <div className="mt-4 space-y-3">
                {comms.length
                  ? comms.map((row) => (
                      <article key={row.id} className="rounded-xl border border-line bg-paper p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold capitalize">{row.recipient_role} notification</p>
                            <p className="mt-1 text-xs text-muted">
                              {row.recipient_email} · order {row.order_id.slice(0, 8)}
                            </p>
                          </div>
                          <StatusPill status={row.status} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-muted">
                            Attempts: {row.attempts}
                            {row.last_error ? ` · ${row.last_error}` : ""}
                          </p>
                          {(row.status === "failed" || row.status === "pending") && (
                            <NotificationRetryButton orderId={row.order_id} />
                          )}
                        </div>
                      </article>
                    ))
                  : <p className="text-sm text-muted">No transactional email records yet.</p>}
              </div>
            </section>

            <section>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-link">Payments</p>
              <h3 className="mt-2 font-display text-xl font-semibold">Recent escrow activity</h3>
              <div className="mt-4 space-y-3">
                {(payments.data ?? []).map((row) => (
                  <div key={row.id} className="rounded-xl border border-line bg-paper p-4">
                    <div className="flex justify-between gap-3">
                      <span className="font-mono text-sm">₦{Number(row.amount).toLocaleString("en-NG")}</span>
                      <span className="text-xs text-link">{row.escrow_status}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      Order {row.order_id.slice(0, 8)} · payout {row.payout_status}
                    </p>
                  </div>
                ))}
                {!payments.data?.length && <p className="text-sm text-muted">No payment records yet.</p>}
              </div>
            </section>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section>
              <h3 className="font-display text-lg font-semibold">Open disputes</h3>
              <div className="mt-3 space-y-3">
                {disputes.data?.length
                  ? disputes.data.map((row) => (
                      <article key={row.id} className="rounded-xl border border-line bg-paper p-4">
                        <p className="text-sm font-semibold">Order {row.order_id.slice(0, 8)}</p>
                        <p className="mt-2 text-sm text-muted">{row.reason}</p>
                      </article>
                    ))
                  : <p className="text-sm text-muted">No open disputes.</p>}
              </div>
            </section>
            <section>
              <h3 className="font-display text-lg font-semibold">Product reports</h3>
              <div className="mt-3 space-y-3">
                {reports.data?.length
                  ? reports.data.map((row) => (
                      <article key={row.id} className="rounded-xl border border-line bg-paper p-4">
                        <Link className="text-sm font-semibold text-link underline" href={`/gigs/${row.gig_id}`}>
                          Open reported product
                        </Link>
                        <p className="mt-2 text-sm text-muted">{row.reason}</p>
                      </article>
                    ))
                  : <p className="text-sm text-muted">No pending reports.</p>}
              </div>
            </section>
          </div>

          <section className="mt-8">
            <h3 className="font-display text-lg font-semibold">Order status snapshot</h3>
            <p className="mt-2 text-xs text-muted">Latest {orderRows.length} recorded orders.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {FLOW.map(([key, label]) => (
                <div key={key} className="rounded-lg border border-line bg-paper p-3">
                  <p className="text-xs text-muted">{label}</p>
                  <p className="mt-1 font-mono text-lg text-ember-cta">{counts[key] ?? 0}</p>
                </div>
              ))}
            </div>
          </section>
        </details>
      </div>
    </AdminWorkspaceShell>
  );
}
