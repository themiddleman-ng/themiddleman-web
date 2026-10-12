import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { requireAdminPage } from "@/lib/server/admin-page";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";
import AdminCommunicationsClient from "./AdminCommunicationsClient";

export const dynamic = "force-dynamic";

export default async function AdminCommunicationsPage() {
  await requireAdminPage();
  if (!productPackagesEnabled()) {
    return (
      <main className="min-h-screen bg-ink text-bone">
        <SiteHeader />
        <section className="mx-auto max-w-3xl px-5 py-12">
          <Link href="/admin" className="text-ember">← Operations</Link>
          <h1 className="mt-4 font-display text-3xl font-bold">Operations messages unavailable</h1>
          <p className="mt-4 text-slate">This communication workspace is enabled only on an isolated preview with the product-operations schema.</p>
        </section>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-5 py-8 md:py-12">
        <Link href="/admin" className="text-sm font-medium text-ember hover:underline">← Admin workspace</Link>
        <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-ember">Seller operations</p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Seller communications</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">
          Start an auditable private conversation with a seller and keep replies alongside the account operations record.
        </p>
        <AdminCommunicationsClient />
      </div>
    </main>
  );
}
