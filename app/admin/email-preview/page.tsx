import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { requireAdminPage } from "@/lib/server/admin-page";
import {
  paymentSettledTemplates,
  productReviewEmailTemplate,
} from "@/lib/server/payment-emails.mjs";

export const dynamic = "force-dynamic";

function EmailPreview({ title, html }: { title: string; html: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.themiddleman.com.ng";
  const previewHtml = html.replace(/cid:middleman-logo/g, appUrl + "/brand/app-icon.png");
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-paper">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-slate">Rendered from the production email template. Preview only; nothing is sent.</p>
      </div>
      <iframe
        title={title}
        sandbox=""
        srcDoc={previewHtml}
        className="h-[620px] w-full bg-paper"
      />
    </section>
  );
}

export default async function AdminEmailPreviewPage() {
  await requireAdminPage();
  const payment = paymentSettledTemplates({
    title: "Brand starter kit",
    amount: 15000,
    sellerAmount: 13200,
    orderId: "preview-order-4821",
    buyerEmail: "buyer@example.com",
    sellerEmail: "creator@example.com",
    sellerName: "Sample Creator",
  });
  const ready = paymentSettledTemplates({
    title: "Brand starter kit",
    amount: 15000,
    sellerAmount: 13200,
    orderId: "preview-order-4821",
    buyerEmail: "buyer@example.com",
    sellerEmail: "creator@example.com",
    sellerName: "Sample Creator",
    productVersionId: "preview-version" as string,
  });
  const review = productReviewEmailTemplate({
    title: "Brand starter kit",
    decision: "changes_requested",
    reasonCategory: "listing_quality",
    notes: "Please add a clearer description of the included files.",
  });

  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-5 py-8 md:py-12">
        <Link href="/admin" className="text-sm font-medium text-ember hover:underline">← Admin workspace</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-ember">Communications</p>
            <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Email template previews</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">
              Check the actual transactional email layouts with sample content before changing copy or styling.
            </p>
          </div>
        </div>
        <div className="mt-7 grid gap-6 xl:grid-cols-2">
          <EmailPreview title="Buyer · payment confirmed" html={payment.buyer.html} />
          <EmailPreview title="Seller · new paid order" html={payment.seller.html} />
          <EmailPreview title="Buyer · approved product ready" html={ready.buyer.html} />
          <EmailPreview title="Seller · product review decision" html={review.html} />
        </div>
      </div>
    </main>
  );
}
