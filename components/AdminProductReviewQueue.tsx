"use client";

import { useCallback, useEffect, useState } from "react";

type ProductReview = {
  id: string;
  gig_id: string;
  seller_profile_id: string;
  version_number: number;
  original_filename: string;
  content_type: string;
  file_size: number;
  sha256: string;
  security_status: string;
  review_status: string;
  uploaded_at: string;
  validation_report: {
    archive?: { entryCount?: number; fileCount?: number; expandedSize?: number; paths?: string[]; truncated?: boolean } | null;
    security?: { adminNotice?: string; malwareScanner?: string; structuralChecksPassed?: boolean };
  };
  gig?: {
    id: string;
    title: string;
    category: string;
    description: string;
    price_ngn: number;
    is_ai_assisted: boolean;
    media: { path: string; url: string }[];
    demo_links: string[];
    demo_video_url: string | null;
  } | null;
  seller?: { display_name: string; verification_status: string } | null;
};

const REASONS = [
  ["listing_description", "Listing description"],
  ["misleading_preview", "Misleading preview"],
  ["product_package", "Product package"],
  ["missing_files", "Missing files"],
  ["prohibited_content", "Prohibited content"],
  ["suspicious_files", "Suspicious files"],
  ["licensing_copyright", "Licensing / copyright"],
  ["pricing_concern", "Pricing concern"],
  ["seller_verification", "Seller verification"],
  ["other", "Other"],
];

function money(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
}
function bytes(value: number) {
  return value < 1024 * 1024 ? Math.round(value / 1024) + " KB" : (value / (1024 * 1024)).toFixed(1) + " MB";
}

function ReviewCard({ item, onReviewed }: { item: ProductReview; onReviewed: (emailStatus: string, versionId: string) => void }) {
  const [decision, setDecision] = useState("approve");
  const [reasonCategory, setReasonCategory] = useState("product_package");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const report = item.validation_report || {};
  const archive = report.archive;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (decision !== "approve" && notes.trim().length < 5) {
      setError("Write a clear note for the seller before requesting changes or rejecting.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/products/" + item.id + "/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reasonCategory, notes: notes.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save this decision.");
      onReviewed(typeof result.emailStatus === "string" ? result.emailStatus : "failed", item.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this decision.");
    } finally { setBusy(false); }
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-paper p-5 text-bone">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold">{item.gig?.title || "Product listing"}</h2>
          <p className="mt-1 text-sm text-slate">
            {item.seller?.display_name || "Seller"} · {item.seller?.verification_status === "approved" ? "Verified seller" : "Seller verification needs attention"}
          </p>
        </div>
        <span className="rounded-full bg-ember/10 px-3 py-1 text-xs font-medium text-ember">Awaiting review</span>
      </div>

      {item.gig ? (
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p><span className="text-slate">Category:</span> {item.gig.category}</p>
          <p><span className="text-slate">Price:</span> {money(item.gig.price_ngn)}</p>
          <p><span className="text-slate">AI-assisted:</span> {item.gig.is_ai_assisted ? "Yes" : "No"}</p>
          <p><span className="text-slate">Seller verification:</span> {item.seller?.verification_status || "unknown"}</p>
        </div>
      ) : <p className="mt-4 text-sm text-amber-300">Listing details could not be loaded.</p>}

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate">{item.gig?.description || "No description available."}</p>

      {(item.gig?.media?.length || item.gig?.demo_links?.length || item.gig?.demo_video_url) ? (
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          {item.gig?.media?.map((media, index) => (
            <a key={media.path} href={media.url} target="_blank" rel="noopener noreferrer" className="text-ember underline underline-offset-2">
              Preview image {index + 1}
            </a>
          ))}
          {item.gig?.demo_video_url ? <a href={item.gig.demo_video_url} target="_blank" rel="noopener noreferrer" className="text-ember underline underline-offset-2">Demo video</a> : null}
          {item.gig?.demo_links?.map((url) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-ember underline underline-offset-2">External demo</a>)}
        </div>
      ) : null}

      <section className="mt-5 rounded-xl bg-ink/50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Private product package · v{item.version_number}</h3>
            <p className="mt-1 break-all text-xs text-slate">{item.original_filename} · {item.content_type} · {bytes(item.file_size)}</p>
          </div>
          <a href={"/api/admin/products/" + item.id + "/file"} className="shrink-0 rounded-full border border-white/15 px-3 py-2 text-xs text-bone hover:border-ember">
            Download to inspect
          </a>
        </div>
        <p className="mt-3 break-all font-mono text-[11px] text-slate">SHA-256: {item.sha256}</p>
        <p className="mt-3 text-xs text-amber-200">{report.security?.adminNotice || "Structural checks only. Malware scanner is not configured."}</p>
        <p className="mt-2 text-xs text-slate">Package status: {item.security_status.split("_").join(" ")}. Static checks do not guarantee that a file is safe. Never execute seller code.</p>
        {archive ? (
          <div className="mt-4">
            <p className="text-xs font-medium text-bone">
              ZIP contents: {archive.fileCount ?? 0} files · {archive.entryCount ?? 0} entries · {bytes(archive.expandedSize ?? 0)} expanded
            </p>
            <ul className="mt-2 max-h-52 space-y-1 overflow-auto rounded-lg bg-black/10 p-3 font-mono text-[11px] text-slate">
              {(archive.paths ?? []).map((path) => <li key={path} className="break-all">{path}</li>)}
            </ul>
            {archive.truncated ? <p className="mt-1 text-xs text-slate">Showing a limited path summary.</p> : null}
          </div>
        ) : null}
      </section>

      <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate">Decision
          <select value={decision} onChange={(event) => setDecision(event.target.value)} className="auth-input mt-2">
            <option value="approve">Approve and publish</option>
            <option value="request_changes">Request changes</option>
            <option value="reject">Reject</option>
          </select>
        </label>
        <label className="text-xs text-slate">Reason
          <select value={reasonCategory} onChange={(event) => setReasonCategory(event.target.value)} className="auth-input mt-2">
            {REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate sm:col-span-2">Seller message {decision !== "approve" ? "(required)" : "(optional)"}
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} rows={3} className="auth-input mt-2" placeholder="Explain the decision clearly. Pricing feedback never changes the seller’s price." />
        </label>
        {error ? <p role="alert" className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
          <p className="text-xs text-slate">This decision creates a seller notification and an operational message.</p>
          <button disabled={busy} className="rounded-full bg-ember px-5 py-2.5 text-xs font-semibold text-ink disabled:opacity-50">
            {busy ? "Saving…" : decision === "approve" ? "Approve product" : decision === "reject" ? "Reject product" : "Request changes"}
          </button>
        </div>
      </form>
    </article>
  );
}

export default function AdminProductReviewQueue() {
  const [items, setItems] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emailNotice, setEmailNotice] = useState<{ versionId: string; message: string; retryable: boolean } | null>(null);
  const [retryBusy, setRetryBusy] = useState(false);
  const [retryError, setRetryError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/products", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load the review queue.");
      setItems(result.products || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the review queue.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function retryReviewEmail() {
    if (!emailNotice) return;
    setRetryBusy(true);
    setRetryError("");
    try {
      const response = await fetch("/api/admin/products/" + emailNotice.versionId + "/email", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The email is still pending.");
      setEmailNotice({ ...emailNotice, message: "The seller email was sent.", retryable: false });
    } catch (cause) {
      setRetryError(cause instanceof Error ? cause.message : "The seller email could not be sent.");
    } finally { setRetryBusy(false); }
  }

  function onReviewed(emailStatus: string, versionId: string) {
    if (emailStatus === "sent") setEmailNotice(null);
    else {
      setEmailNotice({ versionId, message: "The review decision was saved, but the seller email is still pending.", retryable: true });
      setRetryError("");
    }
    void load();
  }

  const emailNoticeView = emailNotice ? (
    <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-200/5 p-4 text-sm text-amber-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>{emailNotice.message}</p>
        <div className="flex items-center gap-3">
          {emailNotice.retryable ? <button type="button" disabled={retryBusy} onClick={retryReviewEmail} className="rounded-full border border-amber-200/30 px-3 py-2 text-xs disabled:opacity-50">{retryBusy ? "Retrying…" : "Retry email"}</button> : null}
          <button type="button" onClick={() => setEmailNotice(null)} className="text-xs underline underline-offset-2">Dismiss</button>
        </div>
      </div>
      {retryError ? <p role="alert" className="mt-2 text-xs text-red-200">{retryError}</p> : null}
    </div>
  ) : null;

  if (loading) return <>{emailNoticeView}<p className="mt-8 text-sm text-slate">Loading product reviews…</p></>;
  if (error) return <>{emailNoticeView}<p role="alert" className="mt-8 text-sm text-red-300">{error}</p></>;

  return (
    <div className="mt-8 space-y-5">
      {emailNoticeView}
      {items.length
        ? items.map((item) => <ReviewCard key={item.id} item={item} onReviewed={onReviewed} />)
        : <p className="text-sm text-slate">No product packages are awaiting review.</p>}
    </div>
  );
}
