import { authenticatedContext, privateJson, serviceClient, uuidPattern } from "@/lib/server/marketplace";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";
import { sameOriginMutation } from "@/lib/server/same-origin.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!productPackagesEnabled()) return privateJson({ error: "Operations messages are not enabled here." }, 404);
  const session = await authenticatedContext();
  if (!session) return privateJson({ error: "Sign in to view operations messages." }, 401);
  const { data: threads, error } = await session.client.from("operational_threads")
    .select("id,subject,context_type,status,updated_at")
    .eq("seller_user_id", session.user.id)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) return privateJson({ error: "Could not load operations messages." }, 500);
  const rows = threads ?? [];
  const ids = rows.map((thread) => thread.id);
  const messages = ids.length
    ? await session.client.from("operational_messages")
      .select("id,thread_id,sender_kind,body,created_at")
      .in("thread_id", ids)
      .order("created_at", { ascending: true })
      .limit(1000)
    : { data: [], error: null };
  if (messages.error) return privateJson({ error: "Could not load conversation messages." }, 500);
  const byThread = new Map<string, Array<Record<string, unknown>>>();
  for (const message of messages.data ?? []) {
    const list = byThread.get(message.thread_id) ?? [];
    list.push(message);
    byThread.set(message.thread_id, list);
  }
  return privateJson({
    threads: rows.map((thread) => ({ ...thread, messages: byThread.get(thread.id) ?? [] })),
  });
}

export async function POST(request: Request) {
  if (!sameOriginMutation(request)) return privateJson({ error: "Invalid request origin." }, 403);
  if (!productPackagesEnabled()) return privateJson({ error: "Operations messages are not enabled here." }, 404);
  const session = await authenticatedContext();
  if (!session) return privateJson({ error: "Sign in to reply." }, 401);
  let body: { threadId?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "Invalid message." }, 400);
  }
  if (!uuidPattern.test(body.threadId ?? "")) return privateJson({ error: "Invalid conversation." }, 400);
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 5000) return privateJson({ error: "Write a message of 1–5000 characters." }, 400);
  const { data: thread } = await session.client.from("operational_threads")
    .select("id,status").eq("id", body.threadId).eq("seller_user_id", session.user.id).maybeSingle();
  if (!thread) return privateJson({ error: "Conversation not found." }, 404);
  if (thread.status !== "open") return privateJson({ error: "This conversation is closed." }, 409);
  const { data: message, error } = await session.client.from("operational_messages").insert({
    thread_id: thread.id,
    sender_id: session.user.id,
    sender_kind: "seller",
    body: text,
  }).select("id,thread_id,sender_kind,body,created_at").single();
  if (error || !message) return privateJson({ error: "Could not send your reply." }, 409);
  const db = serviceClient();
  if (db) await db.from("operational_threads").update({ updated_at: new Date().toISOString() })
    .eq("id", thread.id).eq("seller_user_id", session.user.id);
  return privateJson({ message }, 201);
}
