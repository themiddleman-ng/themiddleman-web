import {
  adminUser,
  privateJson,
  uuidPattern,
} from "@/lib/server/marketplace";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";
import { sameOriginMutation } from "@/lib/server/same-origin.mjs";
import { sendProductReviewEmail } from "@/lib/server/product-review-emails.mjs";

export const runtime = "nodejs";
const REASONS = new Set([
  "listing_description",
  "misleading_preview",
  "product_package",
  "missing_files",
  "prohibited_content",
  "suspicious_files",
  "licensing_copyright",
  "pricing_concern",
  "seller_verification",
  "other",
]);

export async function POST(request: Request, { params }: { params: Promise<{ versionId: string }> }) {
  if (!sameOriginMutation(request)) return privateJson({ error: "Invalid request origin." }, 403);
  if (!productPackagesEnabled()) return privateJson({ error: "Product package review is not enabled here." }, 404);
  const administrator = await adminUser();
  if (!administrator) return privateJson({ error: "Admin access required." }, 403);
  const { versionId } = await params;
  if (!uuidPattern.test(versionId)) return privateJson({ error: "Invalid product version." }, 400);

  let body: { decision?: unknown; reasonCategory?: unknown; notes?: unknown };
  try { body = await request.json(); }
  catch { return privateJson({ error: "Invalid request." }, 400); }
  const decision = body.decision;
  const reasonCategory = body.reasonCategory;
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  if (!["approve", "request_changes", "reject"].includes(String(decision)))
    return privateJson({ error: "Choose approve, request changes or reject." }, 400);
  if (typeof reasonCategory !== "string" || !REASONS.has(reasonCategory))
    return privateJson({ error: "Choose a review reason." }, 400);
  if (notes.length > 2000 || (decision !== "approve" && notes.length < 5))
    return privateJson({ error: "Add a clear review note (5–2000 characters) for changes or rejection." }, 400);

  const { data, error } = await administrator.db.rpc("review_product_version", {
    p_version_id: versionId,
    p_admin_uid: administrator.user.id,
    p_decision: decision,
    p_reason_category: reasonCategory,
    p_notes: notes,
  });
  if (error || !data) return privateJson({ error: error?.message || "Could not save this review decision." }, 409);
  const email = await sendProductReviewEmail({
    admin: administrator.db,
    eventKey: data.email_event_key,
  });
  return privateJson({ result: data, emailStatus: email.status || "failed" });
}
