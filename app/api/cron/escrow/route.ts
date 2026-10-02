import { timingSafeEqual } from "node:crypto";
import { privateJson, serviceClient } from "@/lib/server/marketplace";
import {
  escrowV2Enabled,
  gatewayTestEnabled,
} from "@/lib/server/escrow-config.mjs";
import { runGatewayOperation } from "@/lib/server/escrow-gateway.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!escrowV2Enabled())
    return privateJson({ error: "Escrow scheduler disabled." }, 404);
  const expected = `Bearer ${process.env.ESCROW_CRON_SECRET ?? ""}`,
    actual = request.headers.get("authorization") ?? "";
  if (
    !process.env.ESCROW_CRON_SECRET ||
    process.env.ESCROW_CRON_SECRET.length < 32 ||
    actual.length !== expected.length ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  )
    return privateJson({ error: "Unauthorized." }, 401);
  const db = serviceClient();
  if (!db) return privateJson({ error: "Database unavailable." }, 503);
  const deadlines = await db.rpc("process_escrow_deadlines");
  if (deadlines.error)
    return privateJson({ error: "Deadline processing failed." }, 500);
  if (!gatewayTestEnabled())
    return privateJson({ deadlines: deadlines.data, gateway: "disabled" });
  const pending = await db
    .from("escrow_operations")
    .select("*")
    .in("status", ["submitted", "uncertain"])
    .not("provider_id", "is", null)
    .order("updated_at")
    .limit(1);
  if (pending.error)
    return privateJson({ error: "Reconciliation unavailable." }, 503);
  const claimed = pending.data?.length
    ? { data: pending.data, error: null }
    : await db.rpc("claim_escrow_operation");
  if (claimed.error)
    return privateJson({ error: "Operation queue unavailable." }, 503);
  const job = claimed.data?.[0];
  if (!job) return privateJson({ deadlines: deadlines.data, operation: null });
  const payment = await db
    .from("payments")
    .select("paystack_reference")
    .eq("order_id", job.order_id)
    .single();
  if (payment.error)
    return privateJson(
      { error: "Payment binding unavailable; operation needs reconciliation." },
      503,
    );
  const outcome = await runGatewayOperation({
    job,
    secret: process.env.PAYSTACK_SECRET_KEY,
    paymentReference: payment.data.paystack_reference,
  });
  const finish = await db.rpc("finish_escrow_operation", {
    p_id: job.id,
    p_status: outcome.status,
    p_provider_id: outcome.providerId,
    p_error: outcome.error,
  });
  if (finish.error)
    return privateJson(
      {
        error:
          "Provider outcome needs reconciliation; database confirmation failed.",
      },
      503,
    );
  return privateJson({
    deadlines: deadlines.data,
    operation: { id: job.id, status: outcome.status },
  });
}
