"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import { DotsThreeIcon } from "@phosphor-icons/react/dist/csr/DotsThree";
import { HeartIcon } from "@phosphor-icons/react/dist/csr/Heart";
import { SealCheckIcon } from "@phosphor-icons/react/dist/csr/SealCheck";
import { ShareNetworkIcon } from "@phosphor-icons/react/dist/csr/ShareNetwork";
import { signinHref } from "@/lib/auth/signin-redirect.mjs";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { StarRatingDisplay } from "@/components/StarRating";
import SiteHeader from "@/components/SiteHeader";
import ProductCover from "@/components/marketplace/ProductCover";
import EscrowTrustLine from "@/components/EscrowTrustLine";
import FileTypeIcon, { fileKindFromName } from "@/components/gigs/FileTypeIcon";
import { DESIGN_PREVIEW_GIGS } from "@/lib/design-preview/catalog";
import type { GigPackageListing } from "@/lib/gig-package-listing";

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

const DETAIL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "included", label: "What's included" },
  { id: "requirements", label: "Requirements" },
  { id: "creator", label: "Creator" },
] as const;

type DetailTabId = (typeof DETAIL_TABS)[number]["id"];

export default function GigPageClient({
  gigId,
  purchasesEnabled,
  packageListing = null,
}: {
  gigId: string;
  purchasesEnabled: boolean;
  packageListing?: GigPackageListing | null;
}) {
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
  const [reportOpen, setReportOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [detailTab, setDetailTab] = useState<DetailTabId>("overview");
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [wishlistNotice, setWishlistNotice] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [messageBusy, setMessageBusy] = useState(false);
  const [messageError, setMessageError] = useState("");
  const orderRequestKey = useRef<string | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const returnPath = `/gigs/${gigId}`;
  const purchasesPausedTitle =
    "Checkout is paused while payment and delivery verification continues.";

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
      if (!isSupabaseConfigured) {
        const preview = DESIGN_PREVIEW_GIGS.find((item) => item.id === gigId);
        if (preview) {
          setGig({
            id: preview.id,
            title: preview.title,
            description: preview.description,
            category: preview.category,
            price_ngn: preview.price_ngn,
            is_ai_assisted: preview.is_ai_assisted,
            gallery_image_paths: preview.gallery_image_paths ?? [],
            seller_id: "preview-seller",
            delivery_days: 3,
            experience_tier: null,
            demo_video_path: null,
            demo_links: ["https://example.com"],
            seller_profiles: {
              user_id: "preview-seller",
              display_name: preview.seller_profiles?.display_name ?? "Unknown seller",
              bio: null,
              verification_status: preview.seller_profiles?.verification_status ?? "approved",
            },
          });
          setLoading(false);
          return;
        }
      }
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

  useEffect(() => {
    let cancelled = false;
    async function loadWishlist() {
      if (!userId) {
        setWishlisted(false);
        return;
      }
      try {
        const response = await fetch(`/api/gigs/${gigId}/wishlist`, { cache: "no-store" });
        const result = await response.json();
        if (!cancelled && response.ok) setWishlisted(Boolean(result.saved));
      } catch {
        /* Wishlist is optional when the table is not migrated yet. */
      }
    }
    void loadWishlist();
    return () => { cancelled = true; };
  }, [gigId, userId]);

  useEffect(() => {
    if (!moreOpen) return;
    function closeOnPointer(event: MouseEvent) {
      if (!moreMenuRef.current?.contains(event.target as Node)) setMoreOpen(false);
    }
    window.addEventListener("mousedown", closeOnPointer);
    return () => window.removeEventListener("mousedown", closeOnPointer);
  }, [moreOpen]);

  useEffect(() => {
    if (!shareNotice && !wishlistNotice) return;
    const timer = window.setTimeout(() => {
      setShareNotice("");
      setWishlistNotice("");
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [shareNotice, wishlistNotice]);

  const [checkout, setCheckout] = useState<Checkout | null>(null);

  async function handleBuyAndPay() {
    setActionError("");
    if (!userId) { router.push(signinHref(returnPath)); return; }
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

  async function toggleWishlist() {
    setWishlistNotice("");
    if (!userId) {
      router.push(signinHref(returnPath));
      return;
    }
    setWishlistBusy(true);
    try {
      const response = await fetch(`/api/gigs/${gigId}/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update your saved list.");
      setWishlisted(Boolean(result.saved));
      setWishlistNotice(result.saved ? "Saved to your list." : "Removed from your saved list.");
    } catch (cause) {
      setWishlistNotice(cause instanceof Error ? cause.message : "Could not update your saved list.");
    } finally {
      setWishlistBusy(false);
    }
  }

  async function handleShare() {
    setShareNotice("");
    const url = window.location.href;
    const title = gig?.title ?? "Product on The Middleman";
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url });
        return;
      }
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareNotice("Link copied to clipboard.");
    } catch {
      setShareNotice("Copy this link from your browser address bar.");
    }
  }

  async function openProductMessages() {
    setMessageError("");
    if (!userId) {
      router.push(signinHref("/messages"));
      return;
    }
    setMessageBusy(true);
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Messaging is not available for this product yet.");
      if (result.id) router.push(`/messages?conversation=${result.id}`);
      else router.push("/messages");
    } catch (cause) {
      setMessageError(cause instanceof Error ? cause.message : "Could not open messages.");
    } finally {
      setMessageBusy(false);
    }
  }

  async function handleReportGig() {
    setActionError(""); setReportSuccess(false);
    if (!userId) { router.push(signinHref(returnPath)); return; }
    if (!gig || userId === gig.seller_profiles?.user_id) { setActionError("You cannot report your own product."); return; }
    setReporting(true);
    const { error } = await supabase.from("gig_reports").insert({ gig_id: gig.id, reported_by: userId, reason: reportReason, details: reportDetails.trim() || null });
    if (error) { setActionError(error.message); setReporting(false); return; }
    setReportSuccess(true); setReportDetails(""); setReporting(false); setReportOpen(false);
  }

  useEffect(() => {
    if (!reportOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setReportOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [reportOpen]);

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
  if (loadError || !gig) return <main className="grid min-h-screen place-items-center bg-ink px-6 text-bone"><div className="text-center"><p className="mb-4 text-sm text-slate">{loadError}</p><Link href="/marketplace" className="text-sm text-eyebrow hover:underline">Back to marketplace</Link></div></main>;

  const verified = gig.seller_profiles?.verification_status === "approved";
  const imageUrls = (gig.gallery_image_paths ?? []).map((path) =>
    supabase.storage.from("gig-media").getPublicUrl(path).data.publicUrl,
  );
  const videoUrl = gig.demo_video_path
    ? supabase.storage.from("gig-media").getPublicUrl(gig.demo_video_path).data.publicUrl
    : null;
  const demoLinks = (gig.demo_links ?? []).filter((link) => {
    try {
      return new URL(link).protocol === "https:";
    } catch {
      return false;
    }
  });
  const isOwnGig = userId === gig.seller_profiles?.user_id;
  const requirementLines = [
    gig.delivery_days
      ? `Allow up to ${gig.delivery_days} day${gig.delivery_days > 1 ? "s" : ""} for the seller to deliver after purchase.`
      : null,
    gig.is_ai_assisted ? "This listing discloses that AI tools are used in the product." : null,
  ].filter(Boolean) as string[];

  const showAiPill = gig.is_ai_assisted && gig.category !== "ai_assisted";
  const categoryLabel = CATEGORY_LABELS[gig.category] ?? gig.category;
  const summaryLine = gig.description.replace(/\s+/g, " ").trim().slice(0, 180);

  const names = new Set<string>();
  const packageFiles: { name: string; kind: ReturnType<typeof fileKindFromName> }[] = [];
  if (packageListing?.originalFilename) {
    names.add(packageListing.originalFilename);
    packageFiles.push({
      name: packageListing.originalFilename,
      kind: fileKindFromName(packageListing.originalFilename, packageListing.contentType),
    });
  }
  for (const path of packageListing?.innerPaths ?? []) {
    const leaf = path.split("/").pop();
    if (!leaf || names.has(leaf)) continue;
    names.add(leaf);
    packageFiles.push({ name: leaf, kind: fileKindFromName(leaf) });
  }

  type Slide = { type: "image"; url: string } | { type: "pdf" };
  const slides: Slide[] = imageUrls.map((url) => ({ type: "image", url }));
  if (
    packageListing &&
    fileKindFromName(packageListing.originalFilename, packageListing.contentType) === "pdf" &&
    !slides.some((item) => item.type === "pdf")
  ) {
    slides.push({ type: "pdf" });
  }
  if (slides.length === 0) slides.push({ type: "image", url: "" });

  const safeSlide = Math.min(activeSlide, slides.length - 1);
  const currentSlide = slides[safeSlide];

  const purchaseAction = isOwnGig ? null : purchasesEnabled ? (
    <button onClick={handleBuyAndPay} disabled={paying} className="auth-button w-full min-h-11 rounded-xl">
      {paying ? "Opening Paystack…" : "Buy this product"}
    </button>
  ) : (
    <button
      type="button"
      disabled
      title={purchasesPausedTitle}
      className="w-full min-h-11 rounded-xl bg-ember-cta/40 px-5 py-3 text-sm font-semibold text-on-ember opacity-80"
    >
      Purchases paused
    </button>
  );

  const buyPanel = (
    <div className="rounded-2xl border border-line bg-paper p-5 shadow-sm sm:p-6">
      <h1 className="break-words font-display text-2xl font-bold tracking-tight sm:text-[1.65rem]">{gig.title}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <p className="font-mono text-2xl font-semibold text-ember-cta">₦{gig.price_ngn.toLocaleString()}</p>
        {showAiPill ? (
          <span className="rounded-full bg-ember-cta/10 px-3 py-1 text-xs font-semibold text-link">AI-assisted</span>
        ) : null}
      </div>
      {summaryLine ? <p className="mt-3 text-[15px] leading-relaxed text-muted">{summaryLine}{gig.description.length > summaryLine.length ? "…" : ""}</p> : null}
      <div className="my-5 border-t border-line" />
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full border border-line bg-elevated font-display text-sm font-bold">
          {initialsFrom(gig.seller_profiles?.display_name ?? "?")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
            {gig.seller_profiles?.display_name ?? "Unknown seller"}
            {verified ? (
              <SealCheckIcon size={18} weight="fill" className="text-sky-600" aria-label="Verified seller" />
            ) : null}
          </p>
          <p className="text-xs text-muted">{categoryLabel}</p>
        </div>
        <StarRatingDisplay average={rating.average} count={rating.count} size={13} />
      </div>
      {isOwnGig ? (
        <div className="mt-5 space-y-3">
          <p className="text-center text-xs text-muted">
            This is your product. <Link href="/gigs/mine" className="font-semibold text-link hover:underline">Manage it</Link>
          </p>
          <button
            onClick={handleDeleteGig}
            className="w-full min-h-11 rounded-xl border border-red-900/20 bg-red-950/10 px-5 py-3 text-sm font-semibold text-red-500"
          >
            Delete product
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {purchaseAction}
          {!purchasesEnabled ? (
            <p className="text-center text-xs leading-5 text-muted">
              Payment and delivery are being verified before live checkout is enabled.
            </p>
          ) : (
            <p className="text-center text-xs text-muted">Checkout is enabled only in an isolated Paystack test environment.</p>
          )}
          <EscrowTrustLine className="mt-3" />
        </div>
      )}
      {checkout ? (
        <section className="mt-5 border-t border-line pt-5" aria-label="Checkout summary">
          <h2 className="font-semibold">Review your total</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {(checkout.fees
              ? [
                  ["Product", checkout.fees.price_kobo],
                  ["Service fee (3%)", checkout.fees.buyer_fee_kobo],
                  ["Platform fee ($1)", checkout.fees.flat_fee_kobo],
                  ["VAT on fees", checkout.fees.buyer_vat_kobo],
                  ["Total", checkout.fees.buyer_total_kobo],
                ]
              : [["Total", Number(checkout.order.amount) * 100]]
            ).map(([label, value]) => (
              <div key={String(label)} className="flex justify-between gap-3">
                <dt>{label}</dt>
                <dd>₦{(Number(value) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</dd>
              </div>
            ))}
          </dl>
          {checkout.display ? (
            <p className="mt-3 text-sm text-muted">
              Estimated USD total:{" "}
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                checkout.display.buyer_total_minor / 100,
              )}
            </p>
          ) : null}
          {checkout.fees ? (
            <p className="mt-3 text-xs text-muted">
              You pay in NGN. The USD-to-NGN rate used for the $1 platform fee is locked to this order. Your bank sets its own conversion rate.
            </p>
          ) : null}
          <button onClick={payReviewedCheckout} disabled={paying} className="auth-button mt-4 w-full min-h-11">
            {paying ? "Opening payment…" : "Continue to Paystack"}
          </button>
          <button
            className="mt-3 min-h-11 text-sm text-muted underline"
            disabled={paying}
            onClick={() => {
              setCheckout(null);
              orderRequestKey.current = null;
            }}
          >
            Close checkout
          </button>
        </section>
      ) : null}
      {actionError ? <p className="auth-error mt-4">{actionError}</p> : null}
      {reportSuccess ? <p className="mt-4 text-[14px] font-semibold text-link">Thanks. The admin team will review this product.</p> : null}
    </div>
  );

  const tabPanel = (() => {
    if (detailTab === "overview") {
      return (
        <div className="space-y-4 text-[15px] leading-relaxed text-muted">
          <p className="whitespace-pre-wrap text-bone">{gig.description}</p>
          {videoUrl ? (
            <div>
              <h3 className="font-display text-lg font-semibold text-bone">Demo video</h3>
              <video controls preload="none" className="mt-3 w-full rounded-xl" src={videoUrl}>
                Your browser does not support video playback.
              </video>
            </div>
          ) : null}
          {demoLinks.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {demoLinks.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm font-semibold text-link hover:border-ember-cta"
                >
                  {index === 0 ? "View live demo" : `View live demo ${index + 1}`}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      );
    }
    if (detailTab === "included") {
      return packageFiles.length > 0 ? (
        <ul className="space-y-3">
          {packageFiles.map((file) => (
            <li key={file.name} className="flex items-center gap-3 text-sm text-bone">
              <FileTypeIcon kind={file.kind} />
              <span>{file.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          File-level deliverables are described in the listing. Package filenames appear here when a reviewed product file is on record.
        </p>
      );
    }
    if (detailTab === "requirements") {
      return requirementLines.length > 0 ? (
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
          {requirementLines.map((line) => <li key={line}>{line}</li>)}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          The seller&apos;s description is the source of truth for supported formats and any requirements. Confirm those details before checkout.
        </p>
      );
    }
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <p className="text-sm font-semibold text-bone">{gig.seller_profiles?.display_name ?? "Unknown seller"}</p>
          {verified ? <p className="mt-1 text-xs font-semibold text-link">Verified seller</p> : null}
          {gig.seller_profiles?.bio ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">{gig.seller_profiles.bio}</p>
          ) : (
            <p className="mt-3 text-sm text-muted">This creator has not added a bio yet.</p>
          )}
        </div>
        <aside className="rounded-xl border border-line bg-elevated p-4">
          <p className="text-sm font-semibold text-bone">Ask about customization after purchase</p>
          <p className="mt-2 text-xs leading-5 text-muted">
            Messaging opens once you have a paid order for this product.
          </p>
          <button
            type="button"
            disabled={messageBusy}
            onClick={() => void openProductMessages()}
            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline disabled:opacity-50"
          >
            {messageBusy ? "Opening messages…" : "Message about this product"}
          </button>
          {messageError ? <p className="mt-2 text-xs text-red-500">{messageError}</p> : null}
        </aside>
      </div>
    );
  })();

  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="min-w-0 text-sm text-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/marketplace" className="font-semibold hover:text-link">Marketplace</Link></li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/marketplace?category=${encodeURIComponent(gig.category)}`} className="hover:text-link">
                  {categoryLabel}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="truncate text-bone">{gig.title}</li>
            </ol>
          </nav>
          {!isOwnGig ? (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label={wishlisted ? "Remove from saved list" : "Save product"}
                aria-pressed={wishlisted}
                disabled={wishlistBusy}
                onClick={() => void toggleWishlist()}
                className="grid h-11 w-11 place-items-center rounded-full text-bone hover:bg-elevated disabled:opacity-50"
              >
                <HeartIcon size={22} weight={wishlisted ? "fill" : "regular"} className={wishlisted ? "text-link" : ""} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Share product"
                onClick={() => void handleShare()}
                className="grid h-11 w-11 place-items-center rounded-full text-bone hover:bg-elevated"
              >
                <ShareNetworkIcon size={22} weight="regular" aria-hidden="true" />
              </button>
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  aria-label="More actions"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen((open) => !open)}
                  className="grid h-11 w-11 place-items-center rounded-full text-bone hover:bg-elevated"
                >
                  <DotsThreeIcon size={22} weight="bold" aria-hidden="true" />
                </button>
                {moreOpen ? (
                  <div role="menu" className="absolute right-0 top-12 z-20 min-w-40 rounded-xl border border-line bg-paper p-1.5 shadow-lg">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMoreOpen(false);
                        setReportOpen(true);
                      }}
                      className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-[15px] font-semibold text-link"
                    >
                      Report
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        {shareNotice || wishlistNotice ? (
          <p className="mt-2 text-right text-xs font-semibold text-link" role="status">
            {shareNotice || wishlistNotice}
          </p>
        ) : null}

        <div className="mt-6 grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 lg:col-span-7">
            <div className="overflow-hidden rounded-xl border border-line bg-paper">
              <div className="relative aspect-[16/10] bg-elevated">
                {currentSlide.type === "image" && currentSlide.url ? (
                  <Image
                    unoptimized
                    src={currentSlide.url}
                    fill
                    sizes="(max-width: 1024px) 100vw, 720px"
                    alt={`${gig.title} preview`}
                    className="object-cover"
                  />
                ) : currentSlide.type === "pdf" ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <FileTypeIcon kind="pdf" size={28} className="h-16 w-16" />
                    <p className="text-sm font-semibold text-bone">{packageListing?.originalFilename}</p>
                    <p className="text-xs text-muted">Product file attached to this listing</p>
                  </div>
                ) : (
                  <ProductCover title={gig.title} category={gig.category} label={showAiPill ? "AI-assisted" : undefined} />
                )}
                {slides.length > 1 ? (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      onClick={() => setActiveSlide((index) => (index - 1 + slides.length) % slides.length)}
                      className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-paper/95 text-bone shadow"
                    >
                      <CaretLeftIcon size={20} weight="bold" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      onClick={() => setActiveSlide((index) => (index + 1) % slides.length)}
                      className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-paper/95 text-bone shadow"
                    >
                      <CaretRightIcon size={20} weight="bold" aria-hidden="true" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            {slides.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {slides.map((slide, index) => (
                  <button
                    key={`${slide.type}-${index}`}
                    type="button"
                    aria-label={`Show gallery item ${index + 1}`}
                    aria-current={safeSlide === index}
                    onClick={() => setActiveSlide(index)}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                      safeSlide === index ? "border-ember-cta" : "border-line"
                    }`}
                  >
                    {slide.type === "image" && slide.url ? (
                      <Image unoptimized src={slide.url} fill sizes="96px" alt="" className="object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center bg-elevated">
                        <FileTypeIcon kind="pdf" size={18} className="h-10 w-10 border-0 bg-transparent" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-8 -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Product details">
              {DETAIL_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`gig-tab-${tab.id}`}
                  aria-selected={detailTab === tab.id}
                  aria-controls={`gig-panel-${tab.id}`}
                  onClick={() => setDetailTab(tab.id)}
                  className={`min-h-11 shrink-0 border-b-2 px-3 pb-3 text-sm font-semibold transition-colors ${
                    detailTab === tab.id ? "border-ember-cta text-link" : "border-transparent text-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div
              className="mt-5 rounded-xl border border-line bg-paper p-5"
              role="tabpanel"
              id={`gig-panel-${detailTab}`}
              aria-labelledby={`gig-tab-${detailTab}`}
            >
              {tabPanel}
            </div>

            <section className="mt-10 border-t border-line pt-8">
              <h2 className="font-display text-xl font-bold">Reviews {rating.count > 0 ? `(${rating.count})` : ""}</h2>
              {reviews.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No reviews yet for this product.</p>
              ) : (
                <div className="mt-5 space-y-5">
                  {reviews.map((review, i) => (
                    <div key={i} className="border-b border-line pb-5 last:border-0">
                      <div className="mb-2 flex items-center justify-between">
                        <StarRatingDisplay average={review.rating} count={1} size={12} />
                        <span className="text-xs text-muted">{review.reviewer_name || "Buyer"}</span>
                      </div>
                      {review.comment ? <p className="text-sm leading-relaxed text-muted">{review.comment}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <div className="lg:sticky lg:top-24">{buyPanel}</div>
          </div>
        </div>
      </div>
  {reportOpen && (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#182d41]/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => { if (event.target === event.currentTarget) setReportOpen(false); }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="report-product-title" className="w-full max-w-md rounded-2xl border border-line bg-paper p-5 shadow-[0_24px_80px_rgba(18,34,49,.25)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="report-product-title" className="font-display text-xl font-semibold">Report this product</h2>
            <p className="mt-2 text-sm leading-6 text-slate">Send this product to admin for review if it looks unsafe, misleading, or abusive.</p>
          </div>
          <button type="button" aria-label="Close report form" onClick={() => setReportOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl leading-none text-slate hover:bg-[#f4eee6] hover:text-bone">×</button>
        </div>
        <label className="mt-4 block text-sm font-medium text-bone">Reason<select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="auth-input mt-2"><option>Spam or misleading content</option><option>Inappropriate or abusive content</option><option>Wrong category or pricing</option><option>Suspicious seller activity</option><option>Other</option></select></label>
        <label className="mt-4 block text-sm font-medium text-bone">Details<textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} className="auth-input mt-2 min-h-24" placeholder="Add any extra context for the admin team." /></label>
        <button onClick={handleReportGig} disabled={reporting} className="mt-4 w-full rounded-full bg-[#C2410C] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412] disabled:opacity-50">{reporting ? "Sending report…" : "Submit report"}</button>
      </section>
    </div>
  )}
  {!isOwnGig && (
    <>
      <div className="h-24 lg:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 z-30 border-t border-line bg-paper/96 p-3 backdrop-blur lg:hidden" style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}>
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[13px] text-slate">Price</p>
            <p className="font-mono text-lg font-semibold text-bone">₦{gig.price_ngn.toLocaleString()}</p>
          </div>
          {purchasesEnabled ? (
            <button type="button" onClick={checkout ? payReviewedCheckout : handleBuyAndPay} disabled={paying} className="btn-primary ml-auto inline-flex min-h-11 flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold disabled:opacity-50">
              {paying ? "Opening…" : checkout ? "Continue to Paystack" : "Buy this product"}
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={purchasesPausedTitle}
              className="ml-auto inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-line px-4 text-sm font-semibold text-slate"
            >
              Purchases paused
            </button>
          )}
        </div>
        <EscrowTrustLine compact className="mt-2" />
      </div>
    </>
  )}
    </main>
  );
}

