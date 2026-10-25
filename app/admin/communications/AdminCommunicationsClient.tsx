"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Seller = {
  profileId: string;
  sellerUserId: string;
  displayName: string;
  email: string;
  verificationStatus: string;
};
type Message = { id: string; sender_id: string | null; sender_kind: "seller" | "admin" | "system"; body: string; created_at: string };
type Thread = {
  id: string;
  seller_user_id: string;
  subject: string;
  status: "open" | "closed";
  updated_at: string;
  sellerDisplayName: string;
  sellerEmail: string;
  messages: Message[];
};

export default function AdminCommunicationsClient() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [subject, setSubject] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const activeThread = useMemo(() => threads.find((thread) => thread.id === activeId) ?? null, [threads, activeId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/communications", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load conversations.");
      setSellers(result.sellers ?? []);
      setThreads(result.threads ?? []);
      setActiveId((current) =>
        current && (result.threads ?? []).some((thread: Thread) => thread.id === current)
          ? current
          : result.threads?.[0]?.id ?? "",
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load conversations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function post(payload: Record<string, string>) {
    const response = await fetch("/api/admin/communications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not save the message.");
    return result;
  }

  async function startConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sellerId || !subject.trim() || !firstMessage.trim()) return;
    const seller = sellers.find((row) => row.profileId === sellerId);
    if (!seller) return;
    setBusy(true);
    setError("");
    try {
      const result = await post({
        action: "start",
        profileId: seller.profileId,
        sellerUserId: seller.sellerUserId,
        subject,
        text: firstMessage,
      });
      setSellerId("");
      setSubject("");
      setFirstMessage("");
      await load();
      setActiveId(result.threadId);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not start conversation.");
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeThread || !reply.trim()) return;
    setBusy(true);
    setError("");
    try {
      await post({ action: "message", threadId: activeThread.id, text: reply });
      setReply("");
      await load();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not send message.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-7 grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
      <aside className="space-y-6">
        <form onSubmit={startConversation} className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="font-display text-xl font-semibold">Start a seller conversation</h2>
          <p className="mt-2 text-xs leading-5 text-slate">The seller will see the message in their private Operations inbox.</p>
          <label className="mt-4 block text-sm">
            Seller
            <select required value={sellerId} onChange={(event) => setSellerId(event.target.value)} className="auth-input mt-2">
              <option value="">Choose a seller</option>
              {sellers.map((seller) => (
                <option key={seller.profileId} value={seller.profileId}>
                  {seller.displayName}{seller.email ? " · " + seller.email : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block text-sm">
            Subject
            <input required maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} className="auth-input mt-2" placeholder="Your seller account" />
          </label>
          <label className="mt-4 block text-sm">
            Message
            <textarea required maxLength={5000} value={firstMessage} onChange={(event) => setFirstMessage(event.target.value)} className="auth-input mt-2 min-h-28" placeholder="Write a clear note for the seller." />
          </label>
          <button disabled={busy || !sellerId || !subject.trim() || !firstMessage.trim()} className="mt-4 rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-[#111111] disabled:opacity-50">
            {busy ? "Saving…" : "Start conversation"}
          </button>
        </form>

        <section className="rounded-2xl border border-line bg-paper p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Conversations</h2>
            <button type="button" onClick={() => void load()} className="text-xs font-semibold text-ember hover:underline">Refresh</button>
          </div>
          {loading ? <p className="mt-4 text-sm text-slate">Loading conversations…</p> : threads.length ? (
            <div className="mt-4 space-y-2">
              {threads.map((thread) => (
                <button
                  type="button"
                  key={thread.id}
                  onClick={() => setActiveId(thread.id)}
                  className={"w-full rounded-xl border p-3 text-left transition " + (thread.id === activeId ? "border-ember/50 bg-ember/8" : "border-line hover:border-slate")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{thread.subject}</span>
                      <span className="mt-1 block truncate text-xs text-slate">{thread.sellerDisplayName} · {thread.sellerEmail || "email unavailable"}</span>
                    </span>
                    <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] capitalize text-slate">{thread.status}</span>
                  </div>
                  <span className="mt-2 block text-xs text-slate">{thread.messages.length} messages</span>
                </button>
              ))}
            </div>
          ) : <p className="mt-4 text-sm text-slate">No conversations yet.</p>}
        </section>
      </aside>

      <section className="flex min-h-[32rem] flex-col rounded-2xl border border-line bg-paper">
        {activeThread ? (
          <>
            <header className="border-b border-line px-5 py-4">
              <p className="text-xs text-slate">{activeThread.sellerDisplayName} · {activeThread.sellerEmail || "email unavailable"}</p>
              <h2 className="mt-1 font-display text-xl font-semibold">{activeThread.subject}</h2>
            </header>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {activeThread.messages.map((message) => (
                <article key={message.id} className="border-b border-dashed border-line pb-4">
                  <p className="text-xs text-slate">
                    {message.sender_kind === "admin" ? "Middleman team" : message.sender_kind === "seller" ? activeThread.sellerDisplayName : "System update"}
                    <span className="ml-2">{new Date(message.created_at).toLocaleString()}</span>
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                </article>
              ))}
            </div>
            {activeThread.status === "open" ? (
              <form onSubmit={sendReply} className="border-t border-line p-5">
                <label className="block text-sm">
                  Reply
                  <textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength={5000} className="auth-input mt-2 min-h-24" placeholder="Write a message to the seller." />
                </label>
                <button disabled={busy || !reply.trim()} className="mt-3 rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-[#111111] disabled:opacity-50">
                  {busy ? "Sending…" : "Send reply"}
                </button>
              </form>
            ) : <p className="border-t border-line p-5 text-sm text-slate">This conversation is closed.</p>}
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <p className="max-w-sm text-sm leading-6 text-slate">{loading ? "Loading…" : "Choose a conversation or start one for a seller."}</p>
          </div>
        )}
      </section>
      {error && <p role="alert" className="xl:col-span-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
    </div>
  );
}
