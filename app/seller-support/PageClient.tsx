"use client";

import { useCallback, useEffect, useMemo, useState, FormEvent } from "react";
import SiteHeader from "@/components/SiteHeader";

type Message = { id: string; sender_kind: "seller" | "admin" | "system"; body: string; created_at: string };
type Thread = { id: string; subject: string; status: "open" | "closed"; updated_at: string; messages: Message[] };

export default function SellerSupportPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const activeThread = useMemo(() => threads.find((thread) => thread.id === activeId) ?? null, [threads, activeId]);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/seller/communications", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load Operations messages.");
      setThreads(result.threads ?? []);
      setActiveId((current) =>
        current && (result.threads ?? []).some((thread: Thread) => thread.id === current)
          ? current
          : result.threads?.[0]?.id ?? "",
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load Operations messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeThread || !reply.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/seller/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeThread.id, text: reply }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send your reply.");
      setReply("");
      await load();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Could not send your reply.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-ember">Seller support</p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Operations messages</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate">Private notes from The Middleman team about your seller account and product operations.</p>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
        <div className="mt-7 grid min-h-[32rem] gap-5 lg:grid-cols-[.7fr_1.3fr]">
          <aside className="rounded-2xl border border-line bg-paper p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Your conversations</h2>
              <button type="button" onClick={() => void load()} className="text-xs font-semibold text-ember hover:underline">Refresh</button>
            </div>
            {loading ? <p className="mt-4 text-sm text-slate">Loading…</p> : threads.length ? (
              <div className="mt-4 space-y-2">
                {threads.map((thread) => (
                  <button
                    type="button"
                    key={thread.id}
                    onClick={() => setActiveId(thread.id)}
                    className={"w-full rounded-xl border p-3 text-left transition " + (thread.id === activeId ? "border-ember/50 bg-ember/8" : "border-line hover:border-slate")}
                  >
                    <span className="block truncate text-sm font-semibold">{thread.subject}</span>
                    <span className="mt-1 block text-xs capitalize text-slate">{thread.status} · {thread.messages.length} messages</span>
                  </button>
                ))}
              </div>
            ) : <p className="mt-4 text-sm leading-6 text-slate">No operations messages yet. If the team needs to contact you, the conversation will appear here.</p>}
          </aside>

          <section className="flex min-h-[32rem] flex-col rounded-2xl border border-line bg-paper">
            {activeThread ? (
              <>
                <header className="border-b border-line px-5 py-4">
                  <h2 className="font-display text-xl font-semibold">{activeThread.subject}</h2>
                  <p className="mt-1 text-xs capitalize text-slate">Seller account · {activeThread.status}</p>
                </header>
                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                  {activeThread.messages.map((message) => (
                    <article key={message.id} className="border-b border-dashed border-line pb-4">
                      <p className="text-xs text-slate">
                        {message.sender_kind === "seller" ? "You" : message.sender_kind === "admin" ? "The Middleman team" : "System update"}
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
                      <textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength={5000} className="auth-input mt-2 min-h-24" placeholder="Write a reply to The Middleman team." />
                    </label>
                    <button disabled={busy || !reply.trim()} className="mt-3 rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-50">
                      {busy ? "Sending…" : "Send reply"}
                    </button>
                  </form>
                ) : <p className="border-t border-line p-5 text-sm text-slate">This conversation is closed.</p>}
              </>
            ) : (
              <div className="grid flex-1 place-items-center p-8 text-center">
                <p className="max-w-sm text-sm leading-6 text-slate">{loading ? "Loading…" : "No conversation selected."}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
