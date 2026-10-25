/**
 * Merge public seller card fields onto gig rows after fetching seller_id separately.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {Array<Record<string, unknown> & { seller_id?: string }>} gigs
 */
export async function attachPublicSellerCards(supabase, gigs) {
  if (!gigs.length) return gigs;
  const sellerIds = [...new Set(gigs.map((g) => g.seller_id).filter(Boolean))];
  if (!sellerIds.length) return gigs;
  const { data: sellers } = await supabase
    .from("public_seller_profile_cards")
    .select("id, display_name, verification_status")
    .in("id", sellerIds);
  const byId = new Map((sellers ?? []).map((row) => [row.id, row]));
  return gigs.map((gig) => ({
    ...gig,
    seller_profiles: byId.get(gig.seller_id) ?? null,
  }));
}
