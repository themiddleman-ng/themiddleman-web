"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { StarRatingDisplay } from "@/components/StarRating";
import SiteHeader from "@/components/SiteHeader";

type SellerProfile = { user_id: string; display_name: string; bio: string | null; verification_status: string };
type GigRow = {
  id: string; title: string; description: string; category: string; price_ngn: number;
  is_ai_assisted: boolean; seller_id: string; delivery_days: number | null;
  experience_tier: string | null; seller_profiles: SellerProfile | null;
  gallery_image_paths: string[]; demo_video_path: string | null; demo_links: string[];
};
type Checkout = { order: { id: string; amount: number; status: string }; fees: Record<string, number> | null; display?: {currency:string;buyer_total_minor:number} };
type ReviewRow = { rating: number; comment: string | null; reviewer_name: string | null };
type PaystackWindow = Window & { PaystackPop?: { setup: (options: {
  key: string; email: string | null; amount: number; currency: string; ref: string;
  callback: (response: { reference: string }) => void; onClose: () => void;
}) => { openIframe: () => void } } };

const CATEGORY_LABELS: Record<string, string> = { development: "Development", design: "Design", marketing: "Marketing", writing: "Writing", ai_assisted: "AI-assisted" };

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const win = window as PaystackWindow;
    if (win.PaystackPop) return resolve();
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment provider. Check your connection."));
    document.body.appendChild(script);
  });
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function GigPageClient({ gigId, purchasesEnabled }: { gigId: string; purchasesEnabled: boolean }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [gig, setGig] = useState<GigRow | null>(null);
  const [rating, setRating] = useState({ average: 0, count: 0 });
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [paying, setPaying] = useState(false);
  const [reportReason, setReportReason] = useState("Spam or misleading content");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const orderRequestKey = useRef<string | null>(null);

  useEffect(() => {
    void fetch("/api/gigs/" + gigId + "/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => {});
  }, [gigId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setLoadError("");
      const { data: { user } } = await supabase.auth.getUser();
      if (!cancelled && user) { setUserId(user.id); setUserEmail(user.email ?? null); }
      const { data: gigData, error: gigError } = await supabase.from("gigs").select(
        "id, title, description, category, price_ngn, is_ai_assisted, seller_id, delivery_days, experience_tier, gallery_image_paths, demo_video_path, demo_links, seller_profiles ( user_id, display_name, bio, verification_status )"
      ).eq("id", gigId).single();
      if (cancelled) return;
      if (gigError || !gigData) {
        setLoadError("This product couldn't be found — it may have been removed."); setLoading(false); return;
      }
      setGig(gigData as unknown as GigRow);
      const [{ data: ratingsData }, { data: reviewsData }] = await Promise.all([
        supabase.rpc("get_gig_ratings"), supabase.rpc("get_gig_reviews", { p_gig_id: gigId }),
      ]);
      if (cancelled) return;
      const matched = (ratingsData || []).find((row: { gig_id: string }) => row.gig_id === gigId);
      setRating({ average: matched?.average_rating ?? 0, count: matched?.review_count ?? 0 });
      setReviews(reviewsData || []); setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [gigId]);

  const [checkout, setCheckout] = useState<Checkout | null>(null);

  async function handleBuyAndPay() {
    setActionError("");
    if (!userId) { router.push("/signup?mode=signin"); return; }
    if (!gig) return;
    const sellerUserId = gig.seller_profiles?.user_id;
    if (!sellerUserId) { setActionError("We could not verify the seller account for this product."); return; }
    if (userId === sellerUserId) { setActionError("You cannot buy your own product."); return; }
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) { setActionError("Payments aren't configured yet — add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to .env.local."); return; }
    setPaying(true);
    try {
      orderRequestKey.current ??= crypto.randomUUID();
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": orderRequestKey.current,
        },
        body: JSON.stringify({ gigId: gig.id }),
      });
      const orderResult = await orderResponse.json();
      if (!orderResponse.ok || !orderResult.order?.id) {
        throw new Error(orderResult.error || "Could not create the order.");
      }
      const order = orderResult.order as { id: string; amount: number; status: string };
      if (order.status !== 'pending_payment') { router.push('/orders'); return; }
      setCheckout({ order, fees: orderResult.fees ?? null, display: orderResult.display });
      setPaying(false);
    } catch (err) { setActionError(err instanceof Error ? err.message : String(err)); setPaying(false); }
  }

  async function payReviewedCheckout() {
    if (!checkout) return;
    const { order, fees } = checkout;
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) return;
    setPaying(true);
    try {
      await loadPaystackScript();
      const win = window as PaystackWindow;
      const handler = win.PaystackPop!.setup({
        key: publicKey, email: userEmail, amount: fees?.buyer_total_kobo ?? Number(order.amount) * 100, currency: "NGN", ref: `mm_${order.id}`,
        callback: (response) => {
          fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: response.reference, orderId: order.id }),
          })
            .then(async (res) => {
              const result = await res.json();
              if (!res.ok) throw new Error(result.error || "Payment verification is pending. Check My Orders shortly.");
              return result;
            })
            .then(() => router.push("/orders"))
            .catch(() => {
              setActionError("We couldn't confirm payment yet — check My Orders shortly. Do not pay again.");
              setPaying(false);
            });
        },
        onClose: () => setPaying(false),
      });
      handler.openIframe();
    } catch (err) { setActionError(err instanceof Error ? err.message : String(err)); setPaying(false); }
  }

  async function handleDeleteGig() {
    setActionError("");
    if (!userId || !gig || userId !== gig.seller_profiles?.user_id) return;
    if (!window.confirm("Delete this product? It will no longer appear in the marketplace.")) return;
    const { error } = await supabase.from("gigs").update({ status: "deleted" }).eq("id", gig.id);
    if (error) { setActionError(error.message); return; }
    router.push("/gigs/mine");
  }

  async function handleReportGig() {
    setActionError(""); setReportSuccess(false);
    if (!userId) { router.push("/signup?mode=signin"); return; }
    if (!gig || userId === gig.seller_profiles?.user_id) { setActionError("You cannot report your own product."); return; }
    setReporting(true);
    const { error } = await supabase.from("gig_reports").insert({ gig_id: gig.id, reported_by: userId, reason: reportReason, details: reportDetails.trim() || null });
    if (error) { setActionError(error.message); setReporting(false); return; }
    setReportSuccess(true); setReportDetails(""); setReporting(false);
  }

  if (loading) return (
    <main className="min-h-screen bg-ink text-bone" aria-busy="true" aria-label="Loading product">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="h-3 w-36 rounded bg-slate/20 motion-safe:animate-pulse" />
        <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="aspect-[16/9] rounded-2xl bg-paper/60 motion-safe:animate-pulse" />
            <div className="mt-7 h-7 w-3/4 rounded bg-paper/60 motion-safe:animate-pulse" />
            <div className="mt-4 h-4 w-full rounded bg-paper/40 motion-safe:animate-pulse" />
            <div className="mt-2 h-4 w-5/6 rounded bg-paper/40 motion-safe:animate-pulse" />
          </div>
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-line bg-paper/40 p-6">
              <div className="h-7 w-2/3 rounded bg-paper/60 motion-safe:animate-pulse" />
              <div className="mt-6 h-11 rounded-full bg-paper/60 motion-safe:animate-pulse" />
              <div className="mt-5 h-4 w-1/2 rounded bg-paper/40 motion-safe:animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
  if (loadError || !gig) return <main className="grid min-h-screen place-items-center bg-ink px-6 text-bone"><div className="text-center"><p className="mb-4 text-sm text-slate">{loadError}</p><Link href="/marketplace" className="text-sm text-ember hover:underline">Back to marketplace</Link></div></main>;

  const verified = gig.seller_profiles?.verification_status === "approved";
  const imageUrls = (gig.gallery_image_paths ?? []).map(path => supabase.storage.from('gig-media').getPublicUrl(path).data.publicUrl);
  const videoUrl = gig.demo_video_path ? supabase.storage.from('gig-media').getPublicUrl(gig.demo_video_path).data.publicUrl : null;
  const demoLinks = (gig.demo_links ?? []).filter(link => { try { return new URL(link).protocol === 'https:'; } catch { return false; } });
  const isOwnGig = userId === gig.seller_profiles?.user_id;
  const included = [
    gig.delivery_days ? `Seller's estimated delivery: ${gig.delivery_days} day${gig.delivery_days > 1 ? "s" : ""}` : null,
    gig.is_ai_assisted ? "Seller disclosed that AI tools are used." : null,
  ].filter(Boolean) as string[];

  const purchasePanel = <div className="rounded-2xl border border-line bg-paper p-4 shadow-[0_18px_50px_rgba(31,21,12,.08)] sm:p-6">
    <div className="flex items-baseline justify-between"><span className="text-sm text-slate">Price</span><span className="font-mono text-2xl font-semibold text-bone">₦{gig.price_ngn.toLocaleString()}</span></div>
    {isOwnGig ? <div className="mt-5 space-y-3"><p className="text-center text-xs text-slate">This is your product.{" "}<Link href="/gigs/mine" className="text-ember hover:underline">Manage it</Link></p><button onClick={handleDeleteGig} className="w-full rounded-full border border-red-900/20 bg-red-950/10 px-5 py-3 text-sm font-semibold text-red-500 transition-colors hover:border-red-900/40 hover:bg-red-950/20">Delete product</button></div> : purchasesEnabled ? <div className="mt-5 space-y-3"><button onClick={handleBuyAndPay} disabled={paying} className="auth-button w-full">{paying ? "Opening Paystack…" : "Buy this product"}</button><p className="text-center text-xs text-slate">Checkout is enabled only in an isolated Paystack test environment.</p></div> : <div className="mt-5 rounded-xl bg-[#EFE7DB] p-4 text-center"><p className="text-sm font-semibold text-[#172B45]">Purchases are paused</p><p className="mt-2 text-xs leading-5 text-[#526577]">Payment and delivery are being verified before live checkout is enabled.</p></div>}
    {checkout && <section className="mt-5 border-t border-line pt-5" aria-label="Checkout summary">
      <h2 className="font-semibold">Review your total</h2>
      <dl className="mt-3 space-y-2 text-sm">{(checkout.fees ? [['Product',checkout.fees.price_kobo],['Service fee (3%)',checkout.fees.buyer_fee_kobo],['Platform fee ($1)',checkout.fees.flat_fee_kobo],['VAT on fees',checkout.fees.buyer_vat_kobo],['Total',checkout.fees.buyer_total_kobo]] : [['Total',Number(checkout.order.amount)*100]]).map(([label,value])=><div key={String(label)} className="flex justify-between gap-3"><dt>{label}</dt><dd>₦{(Number(value)/100).toLocaleString('en-NG',{minimumFractionDigits:2})}</dd></div>)}</dl>
      {checkout.display && <p className="mt-3 text-sm text-slate">Estimated USD total: {new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(checkout.display.buyer_total_minor/100)}</p>}
      {checkout.fees && <p className="mt-3 text-xs text-slate">You pay in NGN. The USD-to-NGN rate used for the $1 platform fee is locked to this order. Your bank sets its own conversion rate.</p>}
      <button onClick={payReviewedCheckout} disabled={paying} className="auth-button mt-4 w-full">{paying?'Opening payment…':'Continue to Paystack'}</button>
      <button className="mt-3 text-sm text-slate underline" disabled={paying} onClick={()=>{setCheckout(null);orderRequestKey.current=null;}}>Close checkout</button>
    </section>}
    {actionError && <p className="auth-error mt-4">{actionError}</p>}
  </div>;

  const reportBox = !isOwnGig && <div className="rounded-2xl border border-line bg-paper p-5">
    <p className="text-xs font-bold tracking-[.16em] text-ember">REPORT PRODUCT</p><p className="mt-2 text-sm text-slate">Send this product to admin for review if it looks unsafe, misleading, or abusive.</p>
    <label className="mt-4 block text-sm font-medium text-bone">Reason<select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="auth-input mt-2"><option>Spam or misleading content</option><option>Inappropriate or abusive content</option><option>Wrong category or pricing</option><option>Suspicious seller activity</option><option>Other</option></select></label>
    <label className="mt-4 block text-sm font-medium text-bone">Details<textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} className="auth-input mt-2 min-h-24" placeholder="Add any extra context for the admin team." /></label>
    <button onClick={handleReportGig} disabled={reporting} className="mt-4 w-full rounded-full border border-line bg-amber-50 px-5 py-3 text-sm font-semibold text-bone transition-colors hover:border-ember/40 hover:bg-amber-100 disabled:opacity-50">{reporting ? "Sending report…" : "Report product"}</button>
    {reportSuccess && <p className="mt-3 text-xs text-ember">Thanks. The admin team will review this product.</p>}
  </div>;

  return <main className="min-h-screen bg-ink text-bone"><SiteHeader /><div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-10">
    <Link href="/marketplace" className="text-xs font-semibold text-slate transition-colors hover:text-ember">← Marketplace</Link>
    <div className="mt-4 grid min-w-0 grid-cols-1 gap-7 lg:mt-5 lg:grid-cols-12 lg:gap-10"><div className="min-w-0 lg:col-span-8">
      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_18px_50px_rgba(31,21,12,.08)]"><div className="relative aspect-[4/3] sm:aspect-[16/9]">{imageUrls[0] ? <Image unoptimized src={imageUrls[0]} fill sizes="(max-width: 1024px) 100vw, 800px" alt={`${gig.title} preview`} className="object-cover" /> : <div className="grid h-full w-full place-items-center bg-[#EEF1F2] p-8 text-center"><p className="max-w-sm text-base font-medium text-[#526577]">The seller has not uploaded a product preview yet.</p></div>}</div></div>
      {imageUrls.length > 1 && <div className="mt-3 grid grid-cols-3 gap-3">{imageUrls.slice(1).map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-video overflow-hidden rounded-lg border border-line"><Image unoptimized src={url} fill sizes="250px" alt={`${gig.title} gallery image ${index + 2}`} className="object-cover" /></a>)}</div>}
      {videoUrl && <section className="mt-8"><h2 className="mb-3 font-display text-xl font-bold">Demo video</h2><video controls preload="none" className="w-full rounded-xl" src={videoUrl}>Your browser does not support video playback.</video></section>}
      {demoLinks.length > 0 && <section className="mt-8"><h2 className="mb-3 font-display text-xl font-bold">Explore the demo</h2><div className="flex flex-wrap gap-3">{demoLinks.map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-4 py-2 text-sm text-ember hover:border-ember">Open demo {index + 1} ↗</a>)}</div></section>}
      <div className="mt-8 flex flex-wrap items-center gap-3"><p className="font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-slate">{CATEGORY_LABELS[gig.category] ?? gig.category}</p>{gig.is_ai_assisted && <span className="rounded-full bg-ember/15 px-3 py-1 text-xs font-semibold text-ember">AI-assisted</span>}</div>
      <h1 className="mt-2 break-words font-display text-[1.65rem] font-bold tracking-tight sm:text-4xl">{gig.title}</h1>
      <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-line py-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full border border-line bg-[#FBF4EC] font-display text-sm font-bold text-bone">{initialsFrom(gig.seller_profiles?.display_name ?? "?")}</div><div><p className="text-sm font-medium">{gig.seller_profiles?.display_name ?? "Unknown seller"}</p>{verified ? <p className="text-xs font-semibold text-ember">Verified seller</p> : <p className="text-xs text-slate">Verification in progress</p>}</div></div><div className="sm:ml-auto"><StarRatingDisplay average={rating.average} count={rating.count} size={13} /></div></div>
      <div className="mt-6 lg:hidden">{purchasePanel}</div>
      <section className="mt-10"><h2 className="font-display text-xl font-bold">What you&apos;ll get</h2><p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-slate">{gig.description}</p></section>
      <section className="mt-8"><h2 className="font-display text-xl font-bold">Before you buy</h2><p className="mt-3 text-[15px] leading-relaxed text-slate">The seller&apos;s description is the source of truth for what the product includes, supported formats and any requirements. Confirm those details before checkout.</p>{included.length > 0 && <ul className="mt-4 space-y-3">{included.map((line) => <li key={line} className="flex items-start gap-3 text-[15px] text-bone"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />{line}</li>)}</ul>}<p className="mt-4 text-[14px] leading-6 text-slate">Optional customization is not included unless the listing says so. Paid product add-ons are not available yet.</p></section>
      <section className="mt-10 rounded-2xl bg-[#EFE7DB] p-6"><h2 className="font-display text-lg font-bold text-[#172B45]">Payment and delivery</h2><p className="mt-2 text-[14px] leading-relaxed text-[#526577]">Paystack processes eligible payments. The Middleman does not currently hold funds in escrow or guarantee refunds. Payment confirmation and product delivery are separate steps; use your order page to check the status available for your purchase.</p></section>
      <section className="mt-10 border-t border-line pt-8"><h2 className="font-display text-xl font-bold">Reviews {rating.count > 0 && `(${rating.count})`}</h2>{reviews.length === 0 && <p className="mt-4 text-sm text-slate">No reviews yet for this product.</p>}<div className="mt-5 space-y-5">{reviews.map((review, i) => <div key={i} className="border-b border-line pb-5 last:border-0"><div className="mb-2 flex items-center justify-between"><StarRatingDisplay average={review.rating} count={1} size={12} /><span className="text-xs text-slate">{review.reviewer_name || "Buyer"}</span></div>{review.comment && <p className="text-sm leading-relaxed text-slate">{review.comment}</p>}</div>)}</div></section>
      <div className="mt-10 lg:hidden">{reportBox}</div>
    </div><div className="hidden lg:col-span-4 lg:block"><div className="sticky top-24 space-y-5">{purchasePanel}{reportBox}</div></div></div>
  </div>
  {!isOwnGig && (
    <>
      <div className="h-[4.75rem] lg:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 z-30 border-t border-[#e8e0d6] bg-[#fffdf9]/96 p-3 backdrop-blur lg:hidden" style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}>
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-[#687886]">Price</p>
            <p className="font-mono text-lg font-semibold text-[#172B45]">₦{gig.price_ngn.toLocaleString()}</p>
          </div>
          {purchasesEnabled ? (
            <button type="button" onClick={checkout ? payReviewedCheckout : handleBuyAndPay} disabled={paying} className="ml-auto inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#de641e] px-4 text-sm font-semibold text-white disabled:opacity-50">
              {paying ? "Opening…" : checkout ? "Continue to Paystack" : "Buy this product"}
            </button>
          ) : (
            <p className="ml-auto max-w-[58%] text-right text-xs leading-5 text-[#526577]">Purchases are paused while checkout is verified.</p>
          )}
        </div>
      </div>
    </>
  )}
  </main>;
}

