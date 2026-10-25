"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { signinHref } from "@/lib/auth/signin-redirect.mjs";
import { StarRatingInput } from "@/components/StarRating";
import SiteHeader from "@/components/SiteHeader";

const STATUS_LABELS = {
  pending_payment: "Awaiting payment",
  in_escrow: "Payment received",
  delivered: "Delivery submitted",
  approved: "Buyer approved",
  disputed: "Disputed",
  refunded: "Refunded",
};

function StatusBadge({ status }) {
  const tone =
    status === "approved" ? "text-ember" :
    status === "disputed" ? "text-muted" :
    "text-slate";
  return <span className={`text-xs font-medium ${tone}`}>{STATUS_LABELS[status] || status}</span>;
}

function ReviewForm({ orderId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!rating) { setError("Pick a star rating first."); return; }
    setSubmitting(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("reviews").insert({
      order_id: orderId,
      reviewer_id: user.id,
      rating,
      comment: comment.trim() || null,
    });
    if (insertError) { setError(insertError.message); setSubmitting(false); return; }
    onSubmitted();
  }

  return (
    <div className="mt-4 rounded-xl border border-line bg-ink p-4">
      <p className="text-xs text-slate mb-2">Leave a review</p>
      <StarRatingInput value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional — how did it go?"
        className="auth-input mt-3 min-h-16 text-sm"
      />
      {error && <p className="auth-error mt-2">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting}
        className="mt-3 rounded-full bg-ember px-4 py-2 text-xs font-semibold text-ink hover:bg-ember/90 transition-colors disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </div>
  );
}

function DisputeForm({ orderId, onSubmitted }) {
  const [reason, setReason] = useState("");
  const [ground, setGround] = useState("not_as_described");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (reason.trim().length < 10) { setError("Give a brief description (10+ characters)."); return; }
    setSubmitting(true);
    setError("");
    const response = await fetch(`/api/orders/${orderId}/action`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dispute", ground, reason: reason.trim() }),
    });
    if (!response.ok) { const result = await response.json(); setError(result.error || "Could not open dispute."); setSubmitting(false); return; }
    onSubmitted();
  }

  return (
    <div className="mt-4 rounded-xl border border-line bg-ink p-4">
      <p className="text-xs text-slate mb-2">What went wrong?</p>
      <label className="text-sm">Dispute ground<select className="auth-input my-3" value={ground} onChange={e=>setGround(e.target.value)}><option value="not_as_described">Does not match the listing</option><option value="broken_core_features">Core features do not work</option><option value="missing_core_features">Core features are missing</option><option value="repo_mismatch">Repository does not match the preview</option></select></label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Describe the issue — our team reviews this against the order details."
        className="auth-input min-h-20 text-sm"
      />
      {error && <p className="auth-error mt-2">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting}
        className="mt-3 rounded-full border border-line px-4 py-2 text-xs font-semibold text-bone hover:border-slate transition-colors disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit dispute"}
      </button>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [orderQuery, setOrderQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set());
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [productDownloadEnabled, setProductDownloadEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [files, setFiles] = useState({});
  const [actionError, setActionError] = useState("");
  const [openPanel, setOpenPanel] = useState(null); // { orderId, type: 'review' | 'dispute' }

  async function loadOrders() {
    setLoading(true);
    setLoadError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace(signinHref("/orders")); return; }
    setUserId(user.id);

    const response = await fetch('/api/orders', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) { setLoadError(result.error || 'Could not load orders.'); setLoading(false); return; }
    setOrders(result.orders || []);
    setDeliveryEnabled(Boolean(result.deliveryEnabled));
    setProductDownloadEnabled(Boolean(result.productDownloadEnabled));

    const { data: myReviews } = await supabase.from("reviews").select("order_id").eq("reviewer_id", user.id);
    setReviewedOrderIds(new Set((myReviews || []).map((r) => r.order_id)));
    setLoading(false);
  }

  useEffect(() => { loadOrders(); }, []);

  async function submitDelivery(orderId) {
    const file = files[orderId];
    if (!file || file.size > 10 * 1024 * 1024) { setActionError("Select a supported file under 10 MB."); return; }
    setBusyOrderId(orderId);
    setActionError("");
    try {
      const signed = await fetch(`/api/orders/${orderId}/delivery`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'sign', contentType: file.type }),
      });
      const token = await signed.json();
      if (!signed.ok) throw new Error(token.error || 'Could not prepare upload.');
      const { error: uploadError } = await supabase.storage.from('order-deliveries')
        .uploadToSignedUrl(token.path, token.token, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const submitted = await fetch(`/api/orders/${orderId}/delivery`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'submit', storagePath: token.path }),
      });
      const result = await submitted.json();
      if (!submitted.ok) throw new Error(result.error || 'Could not submit delivery.');
      await loadOrders();
    } catch (cause) { setActionError(cause.message || 'Upload failed.'); }
    finally { setBusyOrderId(null); }
  }

  async function retryPaymentVerification(orderId) {
    setBusyOrderId(orderId);
    setActionError("");
    try {
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: `mm_${orderId}`, orderId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Payment could not be verified yet.");
      await loadOrders();
    } catch (cause) {
      setActionError(cause.message || "Payment could not be verified yet. Do not pay again.");
    } finally {
      setBusyOrderId(null);
    }
  }

  async function approveOrder(orderId) {
    setBusyOrderId(orderId);
    setActionError("");
    try {
      const response = await fetch(`/api/orders/${orderId}/action`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not accept delivery.');
      await loadOrders();
    } catch (cause) { setActionError(cause.message || 'Action failed.'); }
    finally { setBusyOrderId(null); }
  }

  async function openDelivery(orderId) {
    setActionError('');
    const response = await fetch(`/api/orders/${orderId}/delivery`, { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) { setActionError(result.error || 'Delivery unavailable.'); return; }
    window.open(result.url, '_blank', 'noopener,noreferrer');
  }

  if (loading) {
    return <main className="min-h-screen bg-ink text-bone"><SiteHeader /><div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-slate sm:px-6">Loading orders…</div></main>;
  }

  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-10">
        <p className="text-xs font-semibold tracking-[.2em] text-ember">MY ORDERS</p>
        <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">My orders</h1><p className="mt-2 text-sm text-slate">Track and manage your purchases and sales of digital products.</p><Link href="/disputes" className="mt-3 inline-block min-h-10 text-sm font-medium text-ember hover:underline">Respond to a dispute</Link>

        <div className="mm-order-controls mt-5 flex flex-col gap-3 rounded-xl border border-line bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-semibold">Search orders<input type="search" value={orderQuery} onChange={(event) => setOrderQuery(event.target.value)} placeholder="Product or order ID" className="mt-2 block min-h-11 w-full border px-3 text-sm font-normal" /></label>
          <label className="min-w-0 flex-1 text-xs font-semibold sm:flex-none">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-2 block min-h-11 w-full border px-3 text-sm font-normal"><option value="all">All statuses</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="min-w-0 flex-1 text-xs font-semibold sm:flex-none">Role<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="mt-2 block min-h-11 w-full border px-3 text-sm font-normal"><option value="all">Buying & selling</option><option value="buyer">Buying</option><option value="seller">Selling</option></select></label>
        </div>
        {loadError && <p className="mt-6 text-sm text-slate">{loadError}</p>}
        {actionError && <p role="alert" className="mt-6 text-sm text-red-300">{actionError}</p>}

        {!loadError && orders.length === 0 && (
          <p className="mt-6 text-sm text-slate">
            No orders yet. <Link href="/marketplace" className="text-ember hover:underline">Browse the marketplace</Link> to find a product.
          </p>
        )}

        <div className="mt-5 space-y-3 sm:mt-7 sm:space-y-4">
          {orders.filter((order) => (statusFilter === 'all' || order.status === statusFilter) && (roleFilter === 'all' || order.role === roleFilter) && `${order.gigs?.title || ''} ${order.id}`.toLowerCase().includes(orderQuery.trim().toLowerCase())).map((order) => {
            const isBuyer = order.role === 'buyer';
            const counterpart = order.counterpart;
            const alreadyReviewed = reviewedOrderIds.has(order.id);
            const panelOpen = openPanel?.orderId === order.id ? openPanel.type : null;

            return (
              <div key={order.id} className="rounded-2xl border border-line bg-paper p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-display font-bold">{order.gigs?.title ?? "Product"}</p>
                    <p className="text-xs text-slate mt-1">
                      {isBuyer ? "Seller" : "Buyer"}: {counterpart ?? "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">₦{order.amount.toLocaleString()}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate">#{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' })}</p>
                {!['disputed', 'refunded', 'pending_payment'].includes(order.status) && <ol className="mm-order-progress" aria-label="Order progress">{['Payment confirmed', 'In progress', 'Delivery', 'Completed'].map((label, index) => { const progress = order.status === 'approved' ? 3 : order.status === 'delivered' ? 2 : 1; return <li key={label} data-reached={index <= progress} aria-current={index === progress ? 'step' : undefined}>{label}</li>; })}</ol>}
                {!deliveryEnabled && ["in_escrow", "delivered"].includes(order.status) && <p className="mt-3 rounded-lg bg-paper p-3 text-sm text-muted">Delivery actions are paused while the order fulfilment flow is verified.</p>}
                {deliveryEnabled && order.deliveries?.[0]?.review_notes && !isBuyer && <p className="mt-3 text-sm text-slate">Admin feedback: {order.deliveries[0].review_notes}</p>}
                {order.deliveries?.[0]?.dispute_window_closes_at && isBuyer && <p className="mt-3 text-xs text-slate">Review ends {new Date(order.deliveries[0].dispute_window_closes_at).toLocaleString()}. Review the delivery before the stated deadline.</p>}
                {order.deliveries?.[0]?.seller_due_at && !isBuyer && <p className="mt-3 text-xs text-slate">Submission due {new Date(order.deliveries[0].seller_due_at).toLocaleString()}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {productDownloadEnabled && isBuyer && order.productVersion?.review_status === "approved" &&
                    order.productVersion?.access_status === "available" &&
                    ["in_escrow", "delivered", "approved", "disputed"].includes(order.status) && (
                    <a
                      href={"/api/orders/" + order.id + "/product-file"}
                      className="rounded-full bg-ember px-4 py-2 text-xs font-semibold text-ink hover:bg-ember/90 transition-colors"
                    >
                      Download product · v{order.productVersion.version_number}
                    </a>
                  )}
                  {deliveryEnabled && !isBuyer && order.status === "in_escrow" &&
                    (!order.deliveries?.length || ['pending_upload','needs_seller_edit'].includes(order.deliveries[0]?.status)) && (
                    <div className="w-full rounded-xl border border-line p-4">
                      <label className="block text-xs text-slate" htmlFor={`delivery-${order.id}`}>Upload the finished package (max 10 MB). Repository products require a ZIP without .git or secrets.</label>
                      <input id={`delivery-${order.id}`} type="file" accept=".pdf,.zip,.png,.jpg,.jpeg,.txt"
                        className="mt-2 block max-w-full text-sm" onChange={event => setFiles({ ...files, [order.id]: event.target.files?.[0] })} />
                      <button onClick={() => submitDelivery(order.id)} disabled={busyOrderId === order.id}
                        className="mt-3 rounded-full bg-ember px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50">
                        {busyOrderId === order.id ? 'Uploading…' : 'Submit for admin review'}
                      </button>
                    </div>
                  )}
                  {deliveryEnabled && !isBuyer && order.deliveries?.[0]?.status === 'pending_review' && <span className="text-sm text-slate">Awaiting admin review</span>}

                  {isBuyer && order.status === "pending_payment" && (
                    <button
                      onClick={() => retryPaymentVerification(order.id)}
                      disabled={busyOrderId === order.id}
                      className="rounded-full bg-ember px-4 py-2 text-xs font-semibold text-ink hover:bg-ember/90 transition-colors disabled:opacity-50"
                    >
                      {busyOrderId === order.id ? "Checking payment…" : "Retry payment verification"}
                    </button>
                  )}

                  {deliveryEnabled && isBuyer && order.status === "delivered" && (
                    <button
                      onClick={() => approveOrder(order.id)}
                      disabled={busyOrderId === order.id}
                      className="rounded-full bg-ember px-4 py-2 text-xs font-semibold text-ink hover:bg-ember/90 transition-colors disabled:opacity-50"
                    >
                      Accept delivery
                    </button>
                  )}

                  {deliveryEnabled && isBuyer && ['delivered','approved','disputed'].includes(order.status) && order.deliveries?.[0]?.status === 'delivered' && (
                    <button onClick={() => openDelivery(order.id)} className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ember">Download delivery</button>
                  )}

                  {deliveryEnabled && isBuyer && order.status === "approved" && !alreadyReviewed && (
                    <button
                      onClick={() => setOpenPanel(panelOpen === "review" ? null : { orderId: order.id, type: "review" })}
                      className="rounded-full border border-line px-4 py-2 text-xs font-medium text-bone hover:border-slate transition-colors"
                    >
                      Leave a review
                    </button>
                  )}
                  {deliveryEnabled && isBuyer && order.status === "approved" && alreadyReviewed && (
                    <span className="text-xs text-slate">You reviewed this order</span>
                  )}

                  {deliveryEnabled && isBuyer && ["in_escrow", "delivered"].includes(order.status) && (
                    <button
                      onClick={() => setOpenPanel(panelOpen === "dispute" ? null : { orderId: order.id, type: "dispute" })}
                      className="rounded-full border border-line px-4 py-2 text-xs font-medium text-slate hover:border-slate hover:text-bone transition-colors"
                    >
                      Report an issue
                    </button>
                  )}

                  <Link
                    href={`/gigs/${order.gig_id}`}
                    className="rounded-full border border-line px-4 py-2 text-xs font-medium text-slate hover:border-slate hover:text-bone transition-colors"
                  >
                    View product
                  </Link>
                </div>

                {panelOpen === "review" && (
                  <ReviewForm orderId={order.id} onSubmitted={() => { setOpenPanel(null); loadOrders(); }} />
                )}
                {panelOpen === "dispute" && (
                  <DisputeForm orderId={order.id} onSubmitted={() => { setOpenPanel(null); loadOrders(); }} />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

