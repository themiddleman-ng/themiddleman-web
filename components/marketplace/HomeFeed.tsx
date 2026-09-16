"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import FadeIn from "@/components/motion/FadeIn";
import GigCard, { type CardGig, type CardRating } from "./GigCard";
type GigRow = CardGig & { created_at: string };
export default function HomeFeed() {
  const [gigs, setGigs] = useState<GigRow[]>([]); const [ratings, setRatings] = useState<Record<string, CardRating>>({}); const [loading, setLoading] = useState(true);
  useEffect(() => { let cancelled = false; async function load() { const [{ data }, { data: ratingData }] = await Promise.all([supabase.from("gigs").select("id, title, description, category, price_ngn, is_ai_assisted, created_at, seller_profiles ( display_name, verification_status )").eq("status", "active").order("created_at", { ascending: false }).limit(24), supabase.rpc("get_gig_ratings")]); if (cancelled) return; setGigs((data as unknown as GigRow[]) ?? []); const map: Record<string, CardRating> = {}; ((ratingData as Array<{ gig_id: string } & CardRating>) ?? []).forEach((row) => { map[row.gig_id] = row; }); setRatings(map); setLoading(false); } load(); return () => { cancelled = true; }; }, []);
  if (loading || gigs.length === 0) return null;
  const popular = [...gigs].sort((a, b) => (ratings[b.id]?.review_count ?? 0) - (ratings[a.id]?.review_count ?? 0)).slice(0, 4); const fresh = gigs.slice(0, 4);
  const row = (items: GigRow[]) => <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">{items.map((gig, index) => <FadeIn key={gig.id} delay={index * 70} direction="up" duration={500}><GigCard gig={gig} rating={ratings[gig.id]} /></FadeIn>)}</div>;
  return <section className="border-y border-[#E8E0D5] bg-[#F7F3EC]"><div className="mx-auto max-w-7xl px-6 py-16 sm:py-20"><FadeIn direction="up" duration={550}><p className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-[#F26419]">Discover something</p><h2 className="mt-2 max-w-lg font-display text-3xl font-bold tracking-tight text-[#1C1B18] sm:text-4xl">Real work, listed right now.</h2></FadeIn><div className="mt-12 space-y-14"><section><div className="mb-6"><h3 className="font-display text-lg font-bold text-[#1C1B18]">Popular</h3></div>{row(popular)}</section><section><div className="mb-6"><h3 className="font-display text-lg font-bold text-[#1C1B18]">Freshly listed</h3></div>{row(fresh)}</section></div></div></section>;
}