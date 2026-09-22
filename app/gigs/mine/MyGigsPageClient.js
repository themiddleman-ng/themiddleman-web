"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { StarRatingDisplay } from "@/components/StarRating";
import SiteHeader from "@/components/SiteHeader";

const CATEGORY_LABELS = {
  development: "Development",
  design: "Design",
  marketing: "Marketing",
  writing: "Writing",
  ai_assisted: "AI-assisted",
};

export default function MyGigsPage() {
  const [gigs, setGigs] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setLoadError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadError("Sign in to manage your products."); setLoading(false); return; }

    const { data: sellerProfile, error: profileError } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !sellerProfile) {
      setLoadError("We could not load your seller profile.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("gigs")
      .select("id, title, category, price_ngn, status, is_ai_assisted")
      .eq("seller_id", sellerProfile.id)
      .order("created_at", { ascending: false });

    if (error) { setLoadError(error.message); setLoading(false); return; }
    setGigs(data || []);

    const { data: ratingsData } = await supabase.rpc("get_gig_ratings");
    const map = {};
    (ratingsData || []).forEach((row) => { map[row.gig_id] = row; });
    setRatings(map);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(gig) {
    setBusyId(gig.id);
    const nextStatus = gig.status === "active" ? "paused" : "active";
    await supabase.from("gigs").update({ status: nextStatus }).eq("id", gig.id);
    await load();
    setBusyId(null);
  }

  async function deleteGig(gig) {
    const confirmed = window.confirm("Delete this product? It will be removed from the marketplace.");
    if (!confirmed) return;

    setBusyId(gig.id);
    await supabase.from("gigs").update({ status: "deleted" }).eq("id", gig.id);
    await load();
    setBusyId(null);
  }

  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader isSeller />

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[.2em] text-ember">SELLER DASHBOARD</p>
            <h1 className="mt-3 font-display text-3xl font-bold">My products</h1>
          </div>
          <Link
            href="/gigs/new"
            className="rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ember/90 transition-colors"
          >
            + List a new product
          </Link>
        </div>

        {loading && <p className="mt-8 text-sm text-slate">Loading your products…</p>}
        {!loading && loadError && <p className="mt-8 text-sm text-slate">{loadError}</p>}

        {!loading && !loadError && gigs.length === 0 && (
          <p className="mt-8 text-sm text-slate">
            You haven&apos;t listed a product yet. <Link href="/gigs/new" className="text-ember hover:underline">List your first one</Link>.
          </p>
        )}

        <div className="mt-8 space-y-4">
          {gigs.map((gig) => {
            const rating = ratings[gig.id];
            return (
              <div key={gig.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/gigs/${gig.id}`} className="font-display font-bold hover:text-ember transition-colors">
                      {gig.title}
                    </Link>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        gig.status === "active" ? "bg-ember/15 text-ember" : "bg-line text-slate"
                      }`}
                    >
                      {gig.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate mt-1">{CATEGORY_LABELS[gig.category]}</p>
                  <div className="mt-2">
                    <StarRatingDisplay average={rating?.average_rating ?? 0} count={rating?.review_count ?? 0} />
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-mono text-sm">₦{gig.price_ngn.toLocaleString()}</span>
                  <button
                    onClick={() => toggleStatus(gig)}
                    disabled={busyId === gig.id}
                    className="rounded-full border border-line px-4 py-2 text-xs font-medium text-bone hover:border-slate transition-colors disabled:opacity-50"
                  >
                    {gig.status === "active" ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => deleteGig(gig)}
                    disabled={busyId === gig.id || gig.status === "deleted"}
                    className="rounded-full border border-red-900/20 bg-red-950/10 px-4 py-2 text-xs font-medium text-red-500 transition-colors hover:border-red-900/40 hover:bg-red-950/20 disabled:opacity-50"
                  >
                    {gig.status === "deleted" ? "Deleted" : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
