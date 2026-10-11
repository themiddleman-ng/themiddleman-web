import { createHmac } from "node:crypto";
import {
  privateJson,
  serviceClient,
  uuidPattern,
} from "@/lib/server/marketplace";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";
import { sameOriginMutation } from "@/lib/server/same-origin.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOriginMutation(request)) return privateJson({ error: "Invalid request origin." }, 403);
  if (!productPackagesEnabled()) return privateJson({ recorded: false });
  const { id } = await params;
  if (!uuidPattern.test(id)) return privateJson({ error: "Invalid product." }, 400);
  const pepper = process.env.MARKETPLACE_ANALYTICS_PEPPER || "";
  if (pepper.length < 32) return privateJson({ recorded: false });

  const db = serviceClient();
  if (!db) return privateJson({ recorded: false });
  const { data: gig, error: gigError } = await db.from("gigs")
    .select("id")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  if (gigError) return privateJson({ recorded: false });
  if (!gig) return privateJson({ recorded: false });

  const forwarded = request.headers.get("x-forwarded-for");
  const address = forwarded?.split(",")[0]?.trim() || "";
  if (!address) return privateJson({ recorded: false });

  const day = new Date().toISOString().slice(0, 10);
  const dailyHash = createHmac("sha256", pepper).update(day + ":" + address).digest("hex");
  const idempotencyKey = "product-view:" + id + ":" + day + ":" + dailyHash;
  const { error } = await db.from("marketplace_events").upsert({
    event_type: "product.viewed",
    gig_id: id,
    idempotency_key: idempotencyKey,
    properties: { day, daily_visitor_hash: dailyHash },
  }, { onConflict: "idempotency_key", ignoreDuplicates: true });
  return privateJson({ recorded: !error });
}
