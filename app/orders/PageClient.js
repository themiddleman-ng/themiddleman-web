"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { StarRatingInput } from "@/components/StarRating";
import SiteHeader from "@/components/SiteHeader";

const STATUS_LABELS = {
  pending_payment: "Awaiting payment",
  in_escrow: "In escrow",
  delivered: "Delivered — awaiting your approval",
  approved: "Completed",
  disputed: "Disputed",
  refunded: "Refunded",
};

function StatusBadge({ status }) {
  const tone =
    status === "approved" ? "text-ember" :
    status === "disputed" ? "text-[#ff8b6b]" :
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (reason.trim().length < 10) { setError("Give a brief description (10+ characters)."); return; }
    setSubmitting(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("disputes").insert({
      order_id: orderId,
      raised_by: user.id,
      reason: reason.trim(),
    });
    if (insertError) { setError(insertError.message); setSubmitting(false); return; }
    await supabase.from("orders").update({ status: "disputed" }).eq("id", orderId);
    onSubmitted();
  }

  return (
    <div className="mt-4 rounded-xl border border-line bg-ink p-4">
      <p className="text-xs text-slate mb-2">What went wrong?</p>
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
  const [userId, setUserId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [openPanel, setOpenPanel] = useState(null); // { orderId, type: 'review' | 'dispute' }

  async function loadOrders() {
    setLoading(true);
    setLoadError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadError("Sign in to view your orders."); setLoading(false); return; }
    setUserId(user.id);

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, buyer_id, seller_id, gig_id, amount, status, created_at, gigs ( title ), buyer:users!orders_buyer_id_fkey ( full_name ), seller:seller_profiles!orders_seller_id_fkey ( display_name )"
      )
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) { setLoadError(error.message); setLoading(false); return; }
    setOrders(data || []);

    const { data: myReviews } = await supabase.from("reviews").select("order_id").eq("reviewer_id", user.id);
    setReviewedOrderIds(new Set((myReviews || []).map((r) => r.order_id)));
    setLoading(false);
  }

  useEffect(() => { loadOrders(); }, []);

  async function markDelivered(orderId) {
    setBusyOrderId(orderId);
    await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
    await loadOrders();
    setBusyOrderId(null);
  }

  async function approveOrder(orderId) {
    setBusyOrderId(orderId);
    await supabase.from("orders").update({ status: "approved" }).eq("id", orderId);
    await loadOrders();
    setBusyOrderId(null);
  }

  if (loading) {
    return <main className="min-h-screen bg-ink text-bone grid place-items-center"><p className="text-sm text-slate">Loading orders…</p></main>;
  }

  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-xs font-semibold tracking-[.2em] text-ember">MY ORDERS</p>
        <h1 className="mt-3 font-display text-3xl font-bold">Orders &amp; escrow</h1>

        {loadError && <p className="mt-6 text-sm text-slate">{loadError}</p>}

        {!loadError && orders.length === 0 && (
          <p className="mt-6 text-sm text-slate">
            No orders yet. <Link href="/marketplace" className="text-ember hover:underline">Browse the marketplace</Link> to find a product.
          </p>
        )}

        <div className="mt-8 space-y-4">
          {orders.map((order) => {
            const isBuyer = order.buyer_id === userId;
            const counterpart = isBuyer ? order.seller?.display_name : order.buyer?.full_name;
            const alreadyReviewed = reviewedOrderIds.has(order.id);
            const panelOpen = openPanel?.orderId === order.id ? openPanel.type : null;

            return (
              <div key={order.id} className="rounded-2xl border border-line bg-paper p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold">{order.gigs?.title ?? "Product"}</p>
                    <p className="text-xs text-slate mt-1">
                      {isBuyer ? "Seller" : "Buyer"}: {counterpart ?? "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">₦{order.amount.toLocaleString()}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!isBuyer && order.status === "in_escrow" && (
                    <button
                      onClick={() => markDelivered(order.id)}
                      disabled={busyOrderId === order.id}
                      className="rounded-full bg-ember px-4 py-2 text-xs font-semibold text-ink hover:bg-ember/90 transition-colors disabled:opacity-50"
                    >
                      Mark as delivered
                    </button>
                  )}

                  {isBuyer && order.status === "delivered" && (
                    <button
                      onClick={() => approveOrder(order.id)}
                      disabled={busyOrderId === order.id}
                      className="rounded-full bg-ember px-4 py-2 text-xs font-semibold text-ink hover:bg-ember/90 transition-colors disabled:opacity-50"
                    >
                      Approve &amp; release payment
                    </button>
                  )}

                  {isBuyer && order.status === "approved" && !alreadyReviewed && (
                    <button
                      onClick={() => setOpenPanel(panelOpen === "review" ? null : { orderId: order.id, type: "review" })}
                      className="rounded-full border border-line px-4 py-2 text-xs font-medium text-bone hover:border-slate transition-colors"
                    >
                      Leave a review
                    </button>
                  )}
                  {isBuyer && order.status === "approved" && alreadyReviewed && (
                    <span className="text-xs text-slate">You reviewed this order</span>
                  )}

                  {["in_escrow", "delivered"].includes(order.status) && (
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
