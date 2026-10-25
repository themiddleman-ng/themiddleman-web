import Link from "next/link";
import AdminActivityList from "@/components/admin/AdminActivityList";
import AdminOverviewToolbar from "@/components/admin/AdminOverviewToolbar";
import AdminPriorityQueue from "@/components/admin/AdminPriorityQueue";
import type { AdminQueueRow } from "@/components/admin/admin-queue";
import AdminStatCard, { type AdminStatIcon } from "@/components/admin/AdminStatCard";
import AdminWorkspaceShell from "@/components/admin/AdminWorkspaceShell";
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

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "sent"
      ? "border-emerald-500/30 text-emerald-700"
      : status === "failed"
        ? "border-red-500/30 text-red-700"
        : "border-[#F97316]/40 text-[#111111]";
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

  const queue: AdminQueueRow[] = [];

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
        href: `/admin/products?version=${version.id}`,
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
        href: `/admin/products?gig=${gigRow.id}`,
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
      href: `/admin/sellers?focus=${seller.id}&status=pending`,
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
      href: `/admin/review?delivery=${delivery.id}`,
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
        <AdminOverviewToolbar overviewDate={overviewDate} />

        {statCards.length > 0 ? (
          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Operations metrics">
            {statCards.map((card) => (
              <AdminStatCard key={card.label} {...card} />
            ))}
          </section>
        ) : null}

        <AdminPriorityQueue rows={queue} />

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
