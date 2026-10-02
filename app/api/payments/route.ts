import {
  authenticatedUser,
  privateJson,
  serviceClient,
} from "@/lib/server/marketplace";
import { escrowV2Enabled } from "@/lib/server/escrow-config.mjs";
export async function GET() {
  const user = await authenticatedUser(),
    db = serviceClient();
  if (!user) return privateJson({ error: "Sign in first." }, 401);
  if (!db) return privateJson({ error: "Payments unavailable." }, 503);
  const seller = await db
    .from("seller_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const [b, s] = await Promise.all([
    db
      .from("orders")
      .select("id,gigs(title)")
      .eq("buyer_id", user.id)
      .limit(200),
    seller.data
      ? db
          .from("orders")
          .select("id,gigs(title)")
          .eq("seller_id", seller.data.id)
          .limit(200)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (b.error || s.error)
    return privateJson({ error: "Payments unavailable." }, 500);
  const buyerIds = new Set((b.data ?? []).map((o) => o.id));
  const all = [...(b.data ?? []), ...(s.data ?? [])];
  if (!all.length) return privateJson({ payments: [] });
  const payments = await db
    .from("payments")
    .select(
      "id,order_id,amount,paystack_reference,escrow_status,payout_status,created_at",
    )
    .in(
      "order_id",
      all.map((o) => o.id),
    )
    .order("created_at", { ascending: false });
  if (payments.error)
    return privateJson({ error: "Payments unavailable." }, 500);
  const snapshots = escrowV2Enabled()
    ? await db
        .from("order_fee_snapshots")
        .select("*")
        .in(
          "order_id",
          all.map((o) => o.id),
        )
    : { data: [], error: null };
  if (snapshots.error)
    return privateJson({ error: "Fee records unavailable." }, 503);
  return privateJson({
    payments: (payments.data ?? []).map((p) => {
      const fees = snapshots.data?.find((f) => f.order_id === p.order_id),
        buyer = buyerIds.has(p.order_id);
      const o = all.find((o) => o.id === p.order_id),
        title = Array.isArray(o?.gigs)
          ? o.gigs[0]?.title
          : (o?.gigs as unknown as { title: string })?.title;
      return {
        id: p.id,
        order_id: p.order_id,
        created_at: p.created_at,
        escrow_status: p.escrow_status,
        payout_status: p.payout_status,
        role: buyer ? "buyer" : "seller",
        amount: fees
          ? (buyer ? fees.buyer_total_kobo : fees.seller_payout_kobo) / 100
          : p.amount,
        ...(buyer ? { paystack_reference: p.paystack_reference } : {}),
        orders: { gigs: { title } },
        fees: fees
          ? buyer
            ? {
                price_kobo: fees.price_kobo,
                buyer_fee_kobo: fees.buyer_fee_kobo,
                flat_fee_kobo: fees.flat_fee_kobo,
                buyer_vat_kobo: fees.buyer_vat_kobo,
                buyer_total_kobo: fees.buyer_total_kobo,
              }
            : {
                price_kobo: fees.price_kobo,
                commission_kobo: fees.commission_kobo,
                seller_vat_kobo: fees.seller_vat_kobo,
                seller_payout_kobo: fees.seller_payout_kobo,
              }
          : null,
      };
    }),
  });
}
