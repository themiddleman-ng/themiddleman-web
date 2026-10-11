import { createHash } from "node:crypto";
import {
  adminUser,
  privateJson,
  serviceClient,
  uuidPattern,
} from "@/lib/server/marketplace";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 10 * 1024 * 1024;

export async function GET(_request: Request, { params }: { params: Promise<{ versionId: string }> }) {
  if (!productPackagesEnabled()) return privateJson({ error: "Product package review is not enabled here." }, 404);
  const administrator = await adminUser();
  if (!administrator) return privateJson({ error: "Admin access required." }, 403);
  const { versionId } = await params;
  if (!uuidPattern.test(versionId)) return privateJson({ error: "Invalid product version." }, 400);
  const db = serviceClient();
  if (!db) return privateJson({ error: "Product file service is unavailable." }, 503);
  const { data: version, error } = await db.from("product_versions")
    .select("id,storage_path,original_filename,content_type,file_size,sha256,review_status,security_status")
    .eq("id", versionId)
    .maybeSingle();
  if (error) return privateJson({ error: "Could not load package details." }, 500);
  if (!version || version.review_status !== "awaiting_review" ||
      version.security_status !== "structural_pass" ||
      !Number.isSafeInteger(Number(version.file_size)) ||
      Number(version.file_size) < 1 || Number(version.file_size) > MAX_BYTES ||
      !/^[a-f0-9]{64}$/.test(version.sha256))
    return privateJson({ error: "This package is not available for review." }, 404);

  const { data: file, error: fileError } = await db.storage.from("product-packages").download(version.storage_path);
  if (fileError || !file || file.size !== Number(version.file_size) || file.size > MAX_BYTES)
    return privateJson({ error: "The package could not be loaded." }, 404);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (createHash("sha256").update(bytes).digest("hex") !== version.sha256)
    return privateJson({ error: "The package failed its integrity check." }, 409);

  const extension = version.storage_path.split(".").pop()?.toLowerCase() || "bin";
  const filename = "review-" + version.id.slice(0, 8) + "." + extension;
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="' + filename + '"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
