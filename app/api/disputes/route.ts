import {
  authenticatedUser,
  privateJson,
  serviceClient,
  uuidPattern,
} from "@/lib/server/marketplace";
import { sameOriginMutation } from "@/lib/server/same-origin.mjs";
import { escrowV2Enabled } from "@/lib/server/escrow-config.mjs";
export async function GET() {
  const user = await authenticatedUser(),
    db = serviceClient();
  if (!user) return privateJson({ error: "Sign in first." }, 401);
  if (!db || !escrowV2Enabled())
    return privateJson(
      { error: "Disputes need an isolated preview database." },
      503,
    );
  const seller = await db
    .from("seller_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const orders = seller.data
    ? await db.from("orders").select("id").eq("seller_id", seller.data.id)
    : { data: [], error: null };
  if (orders.error) return privateJson({ error: "Disputes unavailable." }, 500);
  const ids = orders.data?.map((o) => o.id) ?? [];
  if (!ids.length) return privateJson({ disputes: [] });
  // Explicit fields: raised_by and any buyer identity are never serialized.
  const result = await db
    .from("disputes")
    .select(
      "id,order_id,reason,ground,status,seller_response,seller_response_due_at,seller_responded_at,resolution_notes",
    )
    .in("order_id", ids)
    .order("created_at", { ascending: false })
    .limit(100);
  return result.error
    ? privateJson({ error: "Disputes unavailable." }, 500)
    : privateJson({ disputes: result.data });
}
export async function POST(request: Request) {
  if (!sameOriginMutation(request))
    return privateJson({ error: "Invalid origin." }, 403);
  if (!escrowV2Enabled())
    return privateJson(
      { error: "Disputes need an isolated preview database." },
      503,
    );
  const user = await authenticatedUser(),
    db = serviceClient();
  if (!user) return privateJson({ error: "Sign in first." }, 401);
  if (!db) return privateJson({ error: "Disputes unavailable." }, 503);
  let b;
  try {
    b = await request.json();
  } catch {
    return privateJson({ error: "Invalid JSON." }, 400);
  }
  if (
    !uuidPattern.test(b.disputeId ?? "") ||
    typeof b.response !== "string" ||
    b.response.trim().length < 10 ||
    b.response.length > 2000
  )
    return privateJson({ error: "Provide a 10–2000 character response." }, 400);
  const result = await db.rpc("respond_escrow_dispute", {
    p_dispute_id: b.disputeId,
    p_seller_uid: user.id,
    p_response: b.response.trim(),
  });
  return result.error
    ? privateJson(
        { error: "Response deadline passed or dispute unavailable." },
        409,
      )
    : privateJson({ ok: true });
}
