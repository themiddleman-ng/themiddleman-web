import {
  authenticatedUser,
  privateJson,
  serviceClient,
  uuidPattern,
} from "@/lib/server/marketplace";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";
import { sameOriginMutation } from "@/lib/server/same-origin.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return privateJson({ error: "Sign in to view notifications." }, 401);
  if (!productPackagesEnabled()) return privateJson({ notifications: [], unreadCount: 0 });
  const db = serviceClient();
  if (!db) return privateJson({ error: "Notifications are unavailable." }, 503);
  const { data, error } = await db.from("notifications")
    .select("id,source,notification_type,title,body,href,read_at,action_required,created_at")
    .eq("recipient_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return privateJson({ error: "Could not load notifications." }, 500);
  const notifications = data ?? [];
  return privateJson({
    notifications,
    unreadCount: notifications.filter((item) => !item.read_at).length,
  });
}

export async function POST(request: Request) {
  if (!sameOriginMutation(request)) return privateJson({ error: "Invalid request origin." }, 403);
  const user = await authenticatedUser();
  if (!user) return privateJson({ error: "Sign in to update notifications." }, 401);
  if (!productPackagesEnabled()) return privateJson({ error: "Notifications are not enabled here." }, 404);
  const db = serviceClient();
  if (!db) return privateJson({ error: "Notifications are unavailable." }, 503);
  let body: { id?: unknown };
  try { body = await request.json(); }
  catch { return privateJson({ error: "Invalid request." }, 400); }
  const now = new Date().toISOString();
  let query = db.from("notifications").update({ read_at: now })
    .eq("recipient_user_id", user.id).is("read_at", null);
  if (body.id !== "all") {
    if (typeof body.id !== "string" || !uuidPattern.test(body.id))
      return privateJson({ error: "Invalid notification." }, 400);
    query = query.eq("id", body.id);
  }
  const { data, error } = await query.select("id");
  if (error) return privateJson({ error: "Could not update notifications." }, 500);
  return privateJson({ updated: data?.length ?? 0 });
}
