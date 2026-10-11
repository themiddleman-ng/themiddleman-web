import { createResendMailer } from "./email.mjs";
import { productReviewEmailTemplate } from "./payment-emails.mjs";

export async function sendProductReviewEmail({
  admin,
  eventKey,
  mailer = createResendMailer(),
}) {
  if (!eventKey) return { ok: false, reason: "missing_event_key" };
  const { data: row, error } = await admin.from("transactional_email_outbox")
    .select("id,event_key,recipient_user_id,template_key,payload,status,attempts")
    .eq("event_key", eventKey)
    .maybeSingle();
  if (error || !row) return { ok: false, reason: "outbox_lookup_failed" };
  if (row.status === "sent") return { ok: true, status: "sent", duplicate: true };
  if (!["pending", "failed"].includes(row.status))
    return { ok: false, reason: "already_claimed" };

  const { data: claimed, error: claimError } = await admin.from("transactional_email_outbox")
    .update({
      status: "sending",
      attempts: Number(row.attempts || 0) + 1,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .in("status", ["pending", "failed"])
    .select("id")
    .maybeSingle();
  if (claimError || !claimed) return { ok: false, reason: "already_claimed" };

  const userResult = await admin.auth.admin.getUserById(row.recipient_user_id);
  const recipient = userResult.data?.user?.email;
  if (userResult.error || !recipient) {
    await admin.from("transactional_email_outbox").update({
      status: "failed",
      last_error: "Recipient email unavailable.",
      updated_at: new Date().toISOString(),
    }).eq("id", row.id);
    return { ok: false, reason: "recipient_unavailable" };
  }

  const payload = row.payload || {};
  const template = productReviewEmailTemplate({
    title: payload.gig_title,
    decision: payload.decision,
    reasonCategory: payload.reason_category,
    notes: payload.notes,
  });
  const result = await mailer.send({ to: recipient, ...template });
  const updatedAt = new Date().toISOString();
  await admin.from("transactional_email_outbox").update(result.ok
    ? {
        status: "sent",
        provider_message_id: result.id,
        sent_at: updatedAt,
        last_error: null,
        updated_at: updatedAt,
      }
    : {
        status: "failed",
        last_error: result.error || "Email delivery failed.",
        updated_at: updatedAt,
      }).eq("id", row.id);

  return { ok: Boolean(result.ok), status: result.ok ? "sent" : "failed" };
}
