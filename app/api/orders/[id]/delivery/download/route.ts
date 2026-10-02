import { createHash } from "node:crypto";
import {
  adminUser,
  authenticatedUser,
  ORDER_DELIVERIES_BUCKET,
  privateJson,
  serviceClient,
  uuidPattern,
} from "@/lib/server/marketplace";
import { escrowV2Enabled } from "@/lib/server/escrow-config.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!escrowV2Enabled())
    return privateJson(
      { error: "Validated downloads need an isolated preview database." },
      503,
    );
  const { id } = await params;
  if (!uuidPattern.test(id))
    return privateJson({ error: "Invalid order." }, 400);
  const user = await authenticatedUser(),
    db = serviceClient();
  if (!user) return privateJson({ error: "Sign in first." }, 401);
  if (!db) return privateJson({ error: "Delivery unavailable." }, 503);
  const { data: order } = await db
    .from("orders")
    .select("buyer_id,status")
    .eq("id", id)
    .maybeSingle();
  const admin = order?.buyer_id !== user.id ? await adminUser() : null;
  if (!order || (order.buyer_id !== user.id && !admin))
    return privateJson({ error: "Not found." }, 404);
  const { data: d } = await db
    .from("deliveries")
    .select(
      "id,status,storage_path,package_sha256,package_content_type,access_revoked_at",
    )
    .eq("order_id", id)
    .maybeSingle();
  if (
    !d?.storage_path ||
    !d.package_sha256 ||
    (!admin &&
      (d.access_revoked_at ||
        d.status !== "delivered" ||
        !["delivered", "approved", "disputed"].includes(order.status)))
  )
    return privateJson({ error: "Delivery unavailable." }, 404);
  const { data: file, error } = await db.storage
    .from(ORDER_DELIVERIES_BUCKET)
    .download(d.storage_path);
  if (error || !file || file.size > 10485760)
    return privateJson({ error: "Package unavailable." }, 404);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (createHash("sha256").update(bytes).digest("hex") !== d.package_sha256)
    return privateJson({ error: "Package integrity check failed." }, 409);
  // Recheck authorization state after fetching the package, before serving it.
  const latest = await db
    .from("deliveries")
    .select("access_revoked_at,package_sha256")
    .eq("id", d.id)
    .single();
  if (
    latest.error ||
    (!admin && latest.data.access_revoked_at) ||
    latest.data.package_sha256 !== d.package_sha256
  )
    return privateJson({ error: "Delivery changed or access revoked." }, 409);
  const log = await db
    .from("delivery_downloads")
    .insert({
      delivery_id: d.id,
      actor_id: user.id,
      package_sha256: d.package_sha256,
    });
  if (log.error)
    return privateJson({ error: "Could not record delivery access." }, 503);
  const extension = d.storage_path.split(".").pop();
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="middleman-${id}.${extension}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
