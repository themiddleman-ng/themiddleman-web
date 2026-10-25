import Link from "next/link";
import SellerDirectoryFocus from "@/components/admin/SellerDirectoryFocus";
import SiteHeader from "@/components/SiteHeader";
import { requireAdminPage } from "@/lib/server/admin-page";

export const dynamic = "force-dynamic";

const PAID_STATUSES = ["in_escrow", "delivered", "approved", "disputed"];

function VerificationStatus({ value }: { value: string }) {
  const style = value === "approved"
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
    : value === "rejected"
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : "border-amber-500/30 bg-amber-500/10 text-amber-100";
  const label = value.replace(/_/g, " ");
  return <span className={"inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize " + style}>{label}</span>;
}

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; status?: string }>;
}) {
  const { focus, status } = await searchParams;
  const administrator = await requireAdminPage();
  const db = administrator.db;
  let sellerQuery = db.from("seller_profiles")
    .select("id,user_id,display_name,verification_status")
    .order("display_name", { ascending: true })
    .limit(200);
  if (status === "pending") {
    sellerQuery = sellerQuery.eq("verification_status", "pending");
  }
  const sellerResult = await sellerQuery;
  const sellers = sellerResult.data ?? [];
  const sellerIds = sellers.map((seller: { id: string }) => seller.id);
  const userIds = sellers.map((seller: { user_id: string }) => seller.user_id);

  const [usersResult, productsResult, ordersResult] = sellerIds.length
    ? await Promise.all([
        db.from("users").select("id,email,full_name").in("id", userIds),
        db.from("gigs").select("seller_id,status").in("seller_id", sellerIds),
        db.from("orders").select("seller_id,status").in("seller_id", sellerIds).in("status", PAID_STATUSES),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const usersById = new Map((usersResult.data ?? []).map((user: { id: string; email: string; full_name: string | null }) => [user.id, user]));
  const productCounts = new Map<string, { total: number; active: number }>();
  for (const product of productsResult.data ?? []) {
    const count = productCounts.get(product.seller_id) ?? { total: 0, active: 0 };
    count.total += 1;
    if (product.status === "active") count.active += 1;
    productCounts.set(product.seller_id, count);
  }
  const orderCounts = new Map<string, number>();
  for (const order of ordersResult.data ?? []) {
    orderCounts.set(order.seller_id, (orderCounts.get(order.seller_id) ?? 0) + 1);
  }

  return (
    <main className="min-h-screen bg-ink text-bone">
      <SellerDirectoryFocus focusId={focus ?? null} />
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-5 py-8 md:py-12">
        <Link href="/admin" className="text-sm font-medium text-ember hover:underline">← Admin workspace</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-ember">Seller operations</p>
            <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Seller directory</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">
              Review each seller’s verification status, listings and paid orders from the records already in the marketplace.
            </p>
          </div>
          <span className="rounded-full border border-line px-3 py-1.5 text-xs text-slate">
            {sellers.length} shown · maximum 200{status === "pending" ? " · pending verification" : ""}
          </span>
        </div>

        {sellerResult.error ? (
          <div role="alert" className="mt-7 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            Seller records are unavailable right now.
          </div>
        ) : sellers.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-line bg-paper p-6 text-sm text-slate">No seller profiles yet.</p>
        ) : (
          <div className="mt-7 overflow-x-auto rounded-2xl border border-line bg-paper">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line text-xs text-slate">
                <tr>
                  <th className="px-5 py-4 font-semibold">Seller</th>
                  <th className="px-5 py-4 font-semibold">Verification</th>
                  <th className="px-5 py-4 font-semibold">Products</th>
                  <th className="px-5 py-4 font-semibold">Paid orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sellers.map((seller: { id: string; user_id: string; display_name: string | null; verification_status: string }) => {
                  const user = usersById.get(seller.user_id) as { email?: string; full_name?: string | null } | undefined;
                  const products = productCounts.get(seller.id) ?? { total: 0, active: 0 };
                  return (
                    <tr
                      key={seller.id}
                      id={`seller-${seller.id}`}
                      className={`align-middle scroll-mt-24 ${focus === seller.id ? "bg-ember/5 ring-1 ring-inset ring-ember/30" : ""}`}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold">{seller.display_name || user?.full_name || "Creator"}</p>
                        <p className="mt-1 text-xs text-slate">{user?.email || "Email unavailable"}</p>
                      </td>
                      <td className="px-5 py-4"><VerificationStatus value={seller.verification_status} /></td>
                      <td className="px-5 py-4">
                        <span className="font-semibold">{products.total}</span>
                        <span className="ml-2 text-xs text-slate">{products.active} active</span>
                      </td>
                      <td className="px-5 py-4 font-semibold">{orderCounts.get(seller.id) ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
