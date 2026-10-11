import { createHash } from "node:crypto";
import {
  authenticatedUser,
  privateJson,
  serviceClient,
  uuidPattern,
} from "@/lib/server/marketplace";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "product-packages";
const MAX_BYTES = 10 * 1024 * 1024;
const PAID_STATUSES = ["in_escrow", "delivered", "approved", "disputed"];
const CONTENT_TYPES: Record<string, string> = {
  zip: "application/zip",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  txt: "text/plain",
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!productPackagesEnabled())
    return privateJson({ error: "Product package downloads are not enabled here." }, 404);
  const { id } = await params;
  if (!uuidPattern.test(id)) return privateJson({ error: "Invalid order." }, 400);
  const user = await authenticatedUser();
  if (!user) return privateJson({ error: "Sign in to download your product." }, 401);
  const db = serviceClient();
  if (!db) return privateJson({ error: "Product downloads are unavailable." }, 503);

  const { data: order, error: orderError } = await db.from("orders")
    .select("id,buyer_id,status,gig_id,product_version_id")
    .eq("id", id)
    .maybeSingle();
  if (orderError) return privateJson({ error: "Could not verify this purchase." }, 500);
  if (!order || order.buyer_id !== user.id) return privateJson({ error: "Purchase not found." }, 404);
  if (!order.product_version_id || !PAID_STATUSES.includes(order.status))
    return privateJson({ error: "This order does not have an available product file." }, 409);

  const { data: payment, error: paymentError } = await db.from("payments")
    .select("id")
    .eq("order_id", id)
    .limit(1)
    .maybeSingle();
  if (paymentError || !payment)
    return privateJson({ error: "A verified payment is required before download." }, 409);

  const { data: version, error: versionError } = await db.from("product_versions")
    .select("id,gig_id,version_number,storage_path,original_filename,content_type,file_size,sha256,security_status,review_status,access_status")
    .eq("id", order.product_version_id)
    .maybeSingle();
  if (versionError) return privateJson({ error: "Could not verify the purchased product version." }, 500);
  if (!version || version.gig_id !== order.gig_id || version.review_status !== "approved" ||
      version.security_status !== "structural_pass" || version.access_status !== "available")
    return privateJson({ error: "This product file is not currently available." }, 404);
  if (!Number.isSafeInteger(Number(version.file_size)) || Number(version.file_size) < 1 ||
      Number(version.file_size) > MAX_BYTES || !/^[a-f0-9]{64}$/.test(version.sha256))
    return privateJson({ error: "Product file metadata is invalid." }, 409);
  const extension = version.storage_path.split(".").pop()?.toLowerCase() || "";
  const contentType = CONTENT_TYPES[extension];
  if (!contentType || contentType !== version.content_type)
    return privateJson({ error: "Product file type is invalid." }, 409);

  const { data: file, error: fileError } = await db.storage.from(BUCKET).download(version.storage_path);
  if (fileError || !file || file.size !== Number(version.file_size) || file.size > MAX_BYTES)
    return privateJson({ error: "The product file is unavailable." }, 404);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (createHash("sha256").update(bytes).digest("hex") !== version.sha256)
    return privateJson({ error: "The product file failed its integrity check." }, 409);

  const [latestOrder, latestVersion] = await Promise.all([
    db.from("orders").select("buyer_id,status,product_version_id").eq("id", id).maybeSingle(),
    db.from("product_versions").select("sha256,review_status,security_status,access_status")
      .eq("id", version.id).maybeSingle(),
  ]);
  if (latestOrder.error || latestVersion.error ||
      latestOrder.data?.buyer_id !== user.id ||
      latestOrder.data?.product_version_id !== version.id ||
      !PAID_STATUSES.includes(latestOrder.data?.status || "") ||
      latestVersion.data?.sha256 !== version.sha256 ||
      latestVersion.data?.review_status !== "approved" ||
      latestVersion.data?.security_status !== "structural_pass" ||
      latestVersion.data?.access_status !== "available")
    return privateJson({ error: "Purchase access changed before the file could be served." }, 409);

  const { error: auditError } = await db.from("product_downloads").insert({
    order_id: id,
    product_version_id: version.id,
    buyer_id: user.id,
    package_sha256: version.sha256,
  });
  if (auditError) return privateJson({ error: "Could not record this download." }, 503);

  return new Response(bytes, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": 'attachment; filename="middleman-product-' + id.slice(0, 8) + "." + extension + '"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
