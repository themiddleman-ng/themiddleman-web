import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { requireAdminPage } from "@/lib/server/admin-page";
import { escrowV2Enabled } from "@/lib/server/escrow-config.mjs";
import EscrowControls from "./escrow-controls";
export const dynamic = "force-dynamic";
export default async function EscrowAdmin() {
  const { db } = await requireAdminPage();
  if (!escrowV2Enabled())
    return (
      <main className="min-h-screen bg-ink text-bone">
        <SiteHeader />
        <section className="mx-auto max-w-3xl px-5 py-12">
          <Link href="/admin" className="text-ember">
            ← Operations
          </Link>
          <h1 className="mt-4 font-display text-3xl font-bold">
            Escrow setup required
          </h1>
          <p className="mt-4 text-slate">
            This preview shares the live database. New listing, fee, dispute and
            payout controls become available after an isolated preview database
            is configured and the staging migration is applied.
          </p>
        </section>
      </main>
    );
  const [listings, sellers, disputes, operations, signals, late] =
    await Promise.all([
      db
        .from("gigs")
        .select(
          "id,title,repo_url,preview_commit_sha,demo_links,listing_review_status",
        )
        .eq("listing_review_status", "pending")
        .limit(100),
      db
        .from("seller_profiles")
        .select("id,display_name,verification_status")
        .eq("verification_status", "pending")
        .limit(100),
      db
        .from("disputes")
        .select(
          "id,order_id,ground,reason,status,seller_response,seller_response_due_at",
        )
        .eq("status", "open")
        .limit(100),
      db
        .from("escrow_operations")
        .select("id,order_id,kind,amount_kobo,status,last_error,provider_id")
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("seller_review_signals")
        .select("*")
        .gte("upheld_disputes_90d", 3),
      db
        .from("deliveries")
        .select("id,order_id,admin_due_at")
        .eq("status", "pending_review")
        .lt("admin_due_at", new Date().toISOString())
        .limit(100),
    ]);
  if (
    [listings, sellers, disputes, operations, signals, late].some(
      (r) => r.error,
    )
  )
    return (
      <main className="p-10">
        <p role="alert">Escrow schema unavailable. Check staging migration.</p>
      </main>
    );
  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <Link href="/admin" className="text-ember">
          ← Operations
        </Link>
        <h1 className="mt-4 font-display text-4xl font-bold">
          Trust, disputes &amp; payouts
        </h1>
        <p className="mt-3 text-slate">
          {late.data?.length ?? 0} reviews past the 24-hour SLA.{" "}
          {signals.data?.length ?? 0} sellers need review after three upheld
          disputes in 90 days.
        </p>
        <EscrowControls
          listings={listings.data ?? []}
          sellers={sellers.data ?? []}
          disputes={disputes.data ?? []}
          operations={operations.data ?? []}
          signals={signals.data ?? []}
        />
      </section>
    </main>
  );
}
