import {
  adminUser,
  privateJson,
  uuidPattern,
} from "@/lib/server/marketplace";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";
import { sameOriginMutation } from "@/lib/server/same-origin.mjs";
import { sendProductReviewEmail } from "@/lib/server/product-review-emails.mjs";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ versionId: string }> }) {
  if (!sameOriginMutation(request)) return privateJson({ error: "Invalid request origin." }, 403);
  if (!productPackagesEnabled()) return privateJson({ error: "Product email retry is not enabled here." }, 404);
  const administrator = await adminUser();
  if (!administrator) return privateJson({ error: "Admin access required." }, 403);
  const { versionId } = await params;
  if (!uuidPattern.test(versionId)) return privateJson({ error: "Invalid product version." }, 400);
  const email = await sendProductReviewEmail({
    admin: administrator.db,
    eventKey: "product-review-email:" + versionId,
  });
  return email.ok
    ? privateJson({ status: "sent" })
    : privateJson({ status: email.status || "failed", error: "Email is still pending. Check provider configuration and retry." }, 502);
}
