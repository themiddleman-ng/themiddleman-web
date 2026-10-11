import Link from "next/link";
import { redirect } from "next/navigation";
import AdminProductReviewQueue from "@/components/AdminProductReviewQueue";
import { adminUser } from "@/lib/server/marketplace";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const administrator = await adminUser();
  if (!administrator) redirect("/login?next=/admin/products");

  return (
    <main className="min-h-screen bg-ink px-5 py-8 text-bone sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-semibold tracking-[.14em] text-ember">THE MIDDLEMAN · OPERATIONS</p>
            <h1 className="mt-2 font-display text-3xl font-bold">Product review</h1>
          </div>
          <nav className="flex gap-4 text-sm text-slate">
            <Link href="/admin" className="hover:text-bone">Admin</Link>
            <Link href="/marketplace" className="hover:text-bone">Marketplace</Link>
          </nav>
        </header>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate">
          Review the product listing and private package before publication. Structural checks are not a malware scan, and pricing feedback never changes a seller’s price.
        </p>
        {productPackagesEnabled()
          ? <AdminProductReviewQueue />
          : <p className="mt-8 rounded-xl border border-white/10 p-4 text-sm text-slate">Product package review is disabled until this preview has an isolated database and the package migration is verified.</p>}
      </div>
    </main>
  );
}
