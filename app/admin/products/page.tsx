import { Suspense } from "react";
import AdminProductReviewQueue from "@/components/AdminProductReviewQueue";
import AdminWorkspaceShell from "@/components/admin/AdminWorkspaceShell";
import { requireAdminPage } from "@/lib/server/admin-page";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdminPage();

  return (
    <AdminWorkspaceShell>
      <div className="rounded-2xl border border-line bg-paper p-5 shadow-sm md:p-7">
        <header className="border-b border-line pb-5">
          <p className="text-xs font-semibold tracking-[.14em] text-link">THE MIDDLEMAN · OPERATIONS</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Product review</h1>
        </header>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          Review the product listing and private package before publication. Structural checks are not a malware scan, and pricing feedback never changes a seller’s price.
        </p>
        {productPackagesEnabled()
          ? (
            <Suspense fallback={<p className="mt-8 text-sm text-muted">Loading product reviews…</p>}>
              <AdminProductReviewQueue />
            </Suspense>
          )
          : (
            <p className="mt-8 rounded-xl border border-line p-4 text-sm text-muted">
              Product package review is disabled until this preview has an isolated database and the package migration is verified.
            </p>
          )}
      </div>
    </AdminWorkspaceShell>
  );
}
