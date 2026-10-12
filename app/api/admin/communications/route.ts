import { adminUser, privateJson, uuidPattern } from "@/lib/server/marketplace";
import { productPackagesEnabled } from "@/lib/server/product-package-config.mjs";
import { sameOriginMutation } from "@/lib/server/same-origin.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanMessage(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  if (!productPackagesEnabled()) return privateJson({ error: "Operations messages are not enabled here." }, 404);
  const administrator = await adminUser();
  if (!administrator) return privateJson({ error: "Admin access and two-step verification required." }, 403);
  const db = administrator.db;
  const { data: threadRows, error: threadError } = await db.from("operational_threads")
    .select("id,seller_user_id,context_type,context_id,subject,status,updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (threadError) return privateJson({ error: "Could not load seller conversations." }, 500);
  const threads = threadRows ?? [];
  const threadIds = threads.map((thread) => thread.id);
  const sellerUserIds = [...new Set(threads.map((thread) => thread.seller_user_id))];
  const [{ data: sellerRows }, { data: userRows }, { data: messageRows, error: messageError }] = await Promise.all([
    sellerUserIds.length
      ? db.from("seller_profiles").select("user_id,display_name").in("user_id", sellerUserIds)
      : Promise.resolve({ data: [] }),
    sellerUserIds.length
      ? db.from("users").select("id,email,full_name").in("id", sellerUserIds)
      : Promise.resolve({ data: [] }),
    threadIds.length
      ? db.from("operational_messages").select("id,thread_id,sender_id,sender_kind,body,created_at").in("thread_id", threadIds).order("created_at", { ascending: true }).limit(1000)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (messageError) return privateJson({ error: "Could not load conversation messages." }, 500);
  const sellerByUser = new Map((sellerRows ?? []).map((row) => [row.user_id, row]));
  const userById = new Map((userRows ?? []).map((row) => [row.id, row]));
  const messagesByThread = new Map<string, Array<Record<string, unknown>>>();
  for (const message of messageRows ?? []) {
    const list = messagesByThread.get(message.thread_id) ?? [];
    list.push(message);
    messagesByThread.set(message.thread_id, list);
  }
  const sellerProfiles = await db.from("seller_profiles").select("user_id,id,display_name,verification_status").order("display_name", { ascending: true }).limit(500);
  const allSellerUsers = [...new Set((sellerProfiles.data ?? []).map((row) => row.user_id))];
  const allUsers = allSellerUsers.length
    ? await db.from("users").select("id,email,full_name").in("id", allSellerUsers)
    : { data: [] };
  const usersForSelect = new Map((allUsers.data ?? []).map((row) => [row.id, row]));
  const sellers = (sellerProfiles.data ?? []).map((row) => {
    const user = usersForSelect.get(row.user_id);
    return {
      profileId: row.id,
      sellerUserId: row.user_id,
      displayName: row.display_name || user?.full_name || "Creator",
      email: user?.email || "",
      verificationStatus: row.verification_status,
    };
  });
  return privateJson({
    sellers,
    threads: threads.map((thread) => {
      const seller = sellerByUser.get(thread.seller_user_id);
      const user = userById.get(thread.seller_user_id);
      return {
        ...thread,
        sellerDisplayName: seller?.display_name || user?.full_name || "Creator",
        sellerEmail: user?.email || "",
        messages: messagesByThread.get(thread.id) ?? [],
      };
    }),
  });
}

export async function POST(request: Request) {
  if (!sameOriginMutation(request)) return privateJson({ error: "Invalid request origin." }, 403);
  if (!productPackagesEnabled()) return privateJson({ error: "Operations messages are not enabled here." }, 404);
  const administrator = await adminUser();
  if (!administrator) return privateJson({ error: "Admin access and two-step verification required." }, 403);
  let body: {
    action?: string;
    profileId?: string;
    sellerUserId?: string;
    threadId?: string;
    subject?: string;
    text?: string;
  };
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "Invalid request." }, 400);
  }
  const text = cleanMessage(body.text);
  if (!text || text.length > 5000) return privateJson({ error: "Write a message of 1–5000 characters." }, 400);
  const db = administrator.db;
  let threadId = "";
  let recipientUserId = "";

  if (body.action === "start") {
    if (!uuidPattern.test(body.profileId ?? "") || !uuidPattern.test(body.sellerUserId ?? "") ||
      typeof body.subject !== "string" || body.subject.trim().length < 3 || body.subject.trim().length > 120) {
      return privateJson({ error: "Choose a seller and enter a short subject." }, 400);
    }
    const { data: seller } = await db.from("seller_profiles")
      .select("id,user_id").eq("id", body.profileId).eq("user_id", body.sellerUserId).maybeSingle();
    if (!seller) return privateJson({ error: "Seller profile not found." }, 404);
    const { data: thread, error: threadError } = await db.from("operational_threads").upsert({
      seller_user_id: seller.user_id,
      subject: body.subject.trim(),
      context_type: "seller_account",
      context_id: seller.id,
      status: "open",
      created_by: administrator.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "seller_user_id,context_type,context_id" })
      .select("id").single();
    if (threadError || !thread) return privateJson({ error: "Could not start the conversation." }, 409);
    threadId = thread.id;
    recipientUserId = seller.user_id;
  } else if (body.action === "message") {
    if (!uuidPattern.test(body.threadId ?? "")) return privateJson({ error: "Invalid conversation." }, 400);
    const { data: thread } = await db.from("operational_threads")
      .select("id,status,seller_user_id,subject").eq("id", body.threadId).maybeSingle();
    if (!thread) return privateJson({ error: "Conversation not found." }, 404);
    if (thread.status !== "open") return privateJson({ error: "Reopen this conversation before replying." }, 409);
    threadId = thread.id;
    recipientUserId = thread.seller_user_id;
  } else {
    return privateJson({ error: "Choose a valid conversation action." }, 400);
  }

  const { data: message, error: messageError } = await db.from("operational_messages").insert({
    thread_id: threadId,
    sender_id: administrator.user.id,
    sender_kind: "admin",
    body: text,
  }).select("id,thread_id,sender_id,sender_kind,body,created_at").single();
  if (messageError || !message) return privateJson({ error: "Could not save the message." }, 409);
  await db.from("operational_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
  await db.from("notifications").insert({
    recipient_user_id: recipientUserId,
    source: "admin",
    notification_type: "operational_message",
    title: "Message from The Middleman team",
    body: "Open your seller Operations inbox to read this update.",
    href: "/seller-support",
    event_key: "operational-message:" + message.id,
  });
  return privateJson({ threadId, message }, 201);
}
