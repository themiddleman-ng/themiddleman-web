import { adminUser, privateJson, uuidPattern } from "@/lib/server/marketplace";
import { sameOriginMutation } from "@/lib/server/same-origin.mjs";
import { escrowV2Enabled } from "@/lib/server/escrow-config.mjs";
export async function POST(request: Request) {
  if (!sameOriginMutation(request))
    return privateJson({ error: "Invalid origin." }, 403);
  const admin = await adminUser();
  if (!admin)
    return privateJson(
      { error: "Admin role and two-step verification required." },
      403,
    );
  if (!escrowV2Enabled())
    return privateJson({ error: "Isolated preview database required." }, 503);
  let b;
  try {
    b = await request.json();
  } catch {
    return privateJson({ error: "Invalid JSON." }, 400);
  }
  if (
    typeof b.action !== "string" ||
    !["seller", "listing", "recipient", "email", "resolve"].includes(b.action)
  )
    return privateJson({ error: "Invalid action." }, 400);
  if (b.action !== "email" && !uuidPattern.test(b.id ?? ""))
    return privateJson({ error: "Invalid ID." }, 400);
  if (b.action === "resolve") {
    const amount =
      typeof b.principalRefundKobo === "string" &&
      /^\d{1,12}$/.test(b.principalRefundKobo)
        ? Number(b.principalRefundKobo)
        : NaN;
    if (
      !Number.isSafeInteger(amount) ||
      typeof b.notes !== "string" ||
      b.notes.trim().length < 10 ||
      b.notes.length > 2000
    )
      return privateJson(
        { error: "Principal refund must be integer kobo; add decision notes." },
        400,
      );
    const r = await admin.db.rpc("resolve_escrow_dispute", {
      p_dispute_id: b.id,
      p_admin_uid: admin.user.id,
      p_principal_refund_kobo: amount,
      p_notes: b.notes.trim(),
    });
    return r.error
      ? privateJson(
          {
            error:
              "Resolution unavailable: seller response window may still be open or amount exceeds product price.",
          },
          409,
        )
      : privateJson({ ok: true, result: r.data });
  }
  const value =
    b.action === "email"
      ? b.email
      : b.action === "recipient"
        ? b.recipientCode
        : b.decision;
  if (typeof value !== "string" || value.length > 254)
    return privateJson({ error: "Invalid value." }, 400);
  const notes = typeof b.notes === "string" ? b.notes.trim() : "";
  if (
    ["seller", "listing"].includes(b.action) &&
    (notes.length < 5 || notes.length > 2000)
  )
    return privateJson(
      { error: "Add review evidence (5–2000 characters)." },
      400,
    );
  const r = await admin.db.rpc("admin_escrow_setting", {
    p_admin_uid: admin.user.id,
    p_action: b.action,
    p_id: b.id ?? null,
    p_value: value,
    p_notes: notes,
  });
  return r.error
    ? privateJson(
        {
          error:
            "Setting could not be saved. Check the review evidence, repository and decision.",
        },
        409,
      )
    : privateJson({ ok: true });
}
